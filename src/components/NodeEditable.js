import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {ASTNode} from '../ast';
import ContentEditable from './ContentEditable';
import {commitChanges} from '../codeMirror';
import global from '../global';
import classNames from 'classnames';
import {focusSelf} from '../actions';
import {say} from '../utils';

class NodeEditable extends Component {
  static defaultProps = {
    children: null,
    willInsertNode: v => v,
  }

  static propTypes = {
    // NOTE: the presence of this Node means ast is not null
    node: PropTypes.instanceOf(ASTNode),
    children: PropTypes.node,

    willInsertNode: PropTypes.func,
    isInsertion: PropTypes.bool.isRequired,
  }

  constructor(props) {
    super(props);
    if (this.props.value === null) {
      // TODO(Oak): this is bad. Shouldn't access .from and .to directly here
      // since it might be incorrect
      this.cachedValue = global.cm.getRange(this.props.node.from, this.props.node.to);
    }
  }

  saveEdit = (e, done) => {
    e.stopPropagation();
    const {node, setErrorId, onDisableEditable} = this.props;

    if (this.props.value === null || this.props.value === this.cachedValue) {
      this.props.onDisableEditable(false);
      return;
    }

    const value = this.props.willInsertNode(this.props.value, this.props.node);

    commitChanges(
      cm => () => {
        cm.replaceRange(value, node.from, node.to);
      },
      () => {
        onDisableEditable(false);
        setErrorId('');
        say(`${this.props.isInsertion ? 'inserted' : 'changed'} ${value}`);
        done();
      },
      e => {
        const errorText = global.parser.getExceptionMessage(e);
        say(errorText);
        this.ignoreBlur = false;
        setErrorId(node.id);
        this.setSelection(false);
      }
    );
  }

  handleKeyDown = e => {
    switch (e.key) {
    case 'Enter': {
      this.ignoreBlur = true;
      this.saveEdit(e, () => {
        setTimeout(() => this.props.focusSelf(), 200);
      });
      return;
    }
    case 'Escape':
      say('cancelled');
      this.ignoreBlur = true;
      e.stopPropagation();
      this.props.onChange(null);
      this.props.onDisableEditable(false);
      this.props.setErrorId('');
      setTimeout(() => this.props.focusSelf(), 200);
      return;
    }
  }

  handleClick = e => {
    e.stopPropagation();
  }

  componentDidMount() {
    const text = this.props.value !== null ? this.props.value : this.cachedValue;
    say(`${this.props.isInsertion ? 'inserting' : 'editing'} ${text}. Use Enter to save, and Shift-Escape to cancel`);
    this.props.clearSelections();
  }

  /*
   * No need to reset text because we assign new key (via the parser + patching)
   * to changed nodes, so they will be completely unmounted and mounted back
   * with correct values.
   */

  handleBlur = e => {
    if (this.ignoreBlur) return;
    this.saveEdit(e, () => {});
  }

  setSelection = isCollapsed => {
    setTimeout(() => {
      const range = document.createRange();
      range.selectNodeContents(this.element);
      if (isCollapsed) range.collapse(false);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
    }, 10);
  }

  contentEditableDidMount = el => {
    this.element = el;
    this.setSelection(this.props.isInsertion);
  }

  render() {
    const {
      contentEditableProps,
      extraClasses,
      value,
      onChange,
      node,
    } = this.props;

    const classes = [
      'blocks-literal',
      'quarantine',
      'blocks-editing',
      'blocks-node',
      {'blocks-error': this.props.isErrored},
    ].concat(extraClasses);

    const text = value !== null ? value : this.cachedValue;

    return (
      <ContentEditable
        {...contentEditableProps}
        className  = {classNames(classes)}
        role       = "textbox"
        itDidMount = {this.contentEditableDidMount}
        onChange   = {onChange}
        onBlur     = {this.handleBlur}
        onKeyDown  = {this.handleKeyDown}
        onClick    = {this.handleClick}
        aria-label = {text}
        value      = {text} />
    );
  }
}

const mapStateToProps = ({cm, errorId}, {node}) => {
  const isErrored = errorId == node.id;
  return {cm, isErrored};
};

const mapDispatchToProps = dispatch => ({
  setErrorId: errorId => dispatch({type: 'SET_ERROR_ID', errorId}),
  focusSelf: () => dispatch(focusSelf()),
  clearSelections: () => dispatch({type: 'SET_SELECTIONS', selections: []})
});

export default connect(mapStateToProps, mapDispatchToProps)(NodeEditable);

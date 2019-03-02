import ReactTestUtils from 'react-dom/test-utils';
let Simulate = ReactTestUtils.Simulate;

// These exported functions simulate browser events for testing.
// They use React's test utilities whenever possible.
//
// - `node` is the DOM element being interacted with. You may also pass an
//   `ASTNode` here, and its `.element` field will be used.
// - `key` is the name of a keyboard key, given by the `.key` property:
//   https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
//   (You can also just look at the table in the source code below.)
// - `props` sets other properties on the event (whatever you like).

export function click(node) {
  Simulate.click(toElement(node));
}
export function doubleClick(node) {
  Simulate.doubleClick(toElement(node));
}
export function blur(node=document.activeElement) {
  Simulate.blur(toElement(node));
}
// TODO: document.activeElement isn't always a good default to dispatch to.
// What does the _browser_ dispatch to?
export function keyDown(key, props={}, node=document.activeElement) {
  // NOTE(Emmanuel): if it's a textarea, use native browser events
  if(node.nodeName == 'TEXTAREA') {
    let event = new CustomEvent('keydown', {bubbles: true});
    event.which = event.keyCode = getKeyCode(key);
    Object.assign(event, props);
    node.dispatchEvent(event);
  } else {
    Simulate.keyDown(toElement(node), makeKeyEvent(key, props));
  }
}
export function keyPress(key, props={}, node=document.activeElement) {
  Simulate.keyPress(toElement(node), makeKeyEvent(key, props));
}
export function insertText(text) {
  // TODO: can this be done via Simulate?
  document.execCommand('insertText', false, text);
}

// -------------------------------------------------------------------------- //

// Given a key name (like "Enter"), fill out the props properties that a key
// event should have (like `.keyCode=13`).
function makeKeyEvent(key, props) {
  let keyCode = getKeyCode(key);
  let eventProps = {
    which: keyCode, // deprecated
    keyCode: keyCode, // deprecated
    key: key // Good!
  };
  Object.assign(eventProps, props);
  return eventProps;
}

// Convert a `.key` value to its corresponding keycode. The official table can
// be found here:
// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
function getKeyCode(key) {
  // The key code for an (uppercase) letter is that letter's ascii value.
  if (key.match(/^[A-Z]$/)) {
    return key.charCodeAt(0);
  }
  // The key code for a digit is that digit's ascii value.
  if (key.match(/^[0-9]$/)) {
    return key.charCodeAt(0);
  }
  // These key names must match the `.key` event property!
  // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
  switch (key) {
  case "Enter": return 13;
  case "Tab": return 9;
  case " ": return 32;
  case "ArrowLeft": return 37;
  case "ArrowRight": return 39;
  case "ArrowDown": return 40;
  case "ArrowUp": return 38;
  case "Home": return 36;
  case "End": return 35;
  case "PageUp": return 33;
  case "PageDown": return 34;
  case "Backspace": return 8;
  case "Delete": return 46;
  case "Escape": return 27;
  case "F3": return 114;
  case "[": return 219;
  case "]": return 221;
  case "/": return 191;
  case "<": return 188;
  // If you extend this, make sure to match the official table linked above.
  }
}

// Return either `node` or `node.element`, whichever is an instance of a DOM
// element. If neither is, throw an error.
function toElement(node) {
  if (node instanceof Element) {
    return node;
  }
  if (node.element instanceof Element) {
    return node.element;
  }
  throw new Error("Cannot convert value into a DOM node:" + node);
}

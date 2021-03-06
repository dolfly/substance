import { module } from 'substance-test'

import TestHTMLImporter from '../model/TestHTMLImporter'
import DOMElement from '../../ui/DefaultDOMElement'

const test = module('model/HTMLImporter')

let importer

function setup() {
  importer = new TestHTMLImporter()
}

function teardown() {
  importer = null
}

function setupTest(description, fn) {
  test(description, function (t) {
    setup()
    fn(t)
    teardown()
  })
}

var CONTENT = '0123456789'

setupTest("Importing paragraph", function(t) {
  var html = '<p data-id="p1">' + CONTENT + '</p>'
  var el = DOMElement.parseHTML(html)
  var node = importer.convertElement(el)
  t.deepEqual(node.toJSON(), {
    id: "p1",
    type: "paragraph",
    content: CONTENT
  })
  t.end()
})

setupTest("Importing paragraph with strong", function(t) {
  var html = '<p data-id="p1">0123<strong data-id="s1">456</strong>789</p>'
  var el = DOMElement.parseHTML(html)
  importer.convertElement(el)
  var doc = importer.generateDocument()
  var p1 = doc.get('p1')
  var s1 = doc.get('s1')
  t.equal(CONTENT, p1.content, 'paragraph should have correct content')
  t.equal('456', s1.getText(), 'annotation should provide correct text')
  t.end()
})

setupTest("Importing h1", function(t) {
  var html = '<h1 data-id="h1">' + CONTENT + '</h1>'
  var el = DOMElement.parseHTML(html)
  var node = importer.convertElement(el)
  t.deepEqual(node.toJSON(), {
    id: "h1",
    type: "heading",
    level: 1,
    content: CONTENT
  })
  t.end()
})

setupTest("Importing h2", function(t) {
  var html = '<h2 data-id="h2">' + CONTENT + '</h2>'
  var el = DOMElement.parseHTML(html)
  var node = importer.convertElement(el)
  t.deepEqual(node.toJSON(), {
    id: "h2",
    type: "heading",
    level: 2,
    content: CONTENT
  })
  t.end()
})

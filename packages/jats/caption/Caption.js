'use strict';

import { Container } from 'substance'

function Caption() {
  Caption.super.apply(this, arguments);
}

Caption.Prototype = function() {

  this.getTitle = function() {
    var doc = this.getDocument();
    if (doc) {
      return doc.get(this.title);
    }
  };

};

Container.extend(Caption);

Caption.type = 'caption';

/*
  Attributes
    content-type Type of Content
    id Document Internal Identifier
    specific-use Specific Use
    style Style (NISO JATS table model; MathML Tag Set)
    xml:base Base
    xml:lang Language

  Content
    ( title?, (p)* )
*/
Caption.define({
  attributes: { type: 'object', default: {} },
  title: { type: 'title', optional: true },
  nodes: { type: ['p'], default: [] }
});

export default Caption;
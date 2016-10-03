export default {

  type: 'inline-wrapper',

  matchElement: function(el, converter) {
    var blockConverter = converter._getConverterForElement(el, 'block')
    return Boolean(blockConverter && blockConverter.type !== 'unsupported')
  },

  import: function(el, node, converter) {
    node.id = converter.nextId('inline-wrapper')
    node.wrappedNode = converter.convertElement(el).id
  },

  export: function(node, el, converter) {
    return converter.convertNode(node.wrappedNode)
  }

}

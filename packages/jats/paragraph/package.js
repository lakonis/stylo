import Paragraph from './Paragraph'
import ParagraphComponent from './ParagraphComponent'
import ParagraphConverter from './ParagraphConverter'

export default {

  name: 'paragraph',

  configure: function(config) {
    config.addNode(Paragraph)
    config.addComponent(Paragraph.type, ParagraphComponent)
    config.addConverter('jats', ParagraphConverter)
    config.addTextType({
      name: Paragraph.type,
      data: {type: Paragraph.type}
    })
    config.addLabel(Paragraph.type, {
      en: 'Paragraphe',
      de: 'Paragraphe'
    })
    config.addLabel('paragraph.content', {
      en: 'Paragraphe',
      de: 'Paragraphe'
    })
  }
}

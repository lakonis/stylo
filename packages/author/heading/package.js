import Heading from './Heading'
import HeadingComponent from './HeadingComponent'
import { HeadingPackage as CorePackage } from 'substance'

export default {
  name: 'heading',
  configure: function(config) {
    config.addNode(Heading)
    config.addComponent(Heading.type, HeadingComponent)
    config.addConverter('html', CorePackage.HeadingHTMLConverter)
    config.addTextType({
      name: 'heading1',
      data: {type: 'heading', level: 1}
    })
    config.addTextType({
      name: 'heading2',
      data: {type: 'heading', level: 2}
    })
    config.addTextType({
      name: 'heading3',
      data: {type: 'heading', level: 3}
    })
    config.addLabel('heading1', {
      en: 'Heading 1',
      de: 'Überschrift 1'
    })
    config.addLabel('heading2', {
      en: 'Heading 2',
      de: 'Überschrift 2'
    })
    config.addLabel('heading3', {
      en: 'Heading 3',
      de: 'Überschrift 3'
    })
  }
}

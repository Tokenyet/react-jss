import {Component, Children} from 'react'
import {node, func, string} from 'prop-types'
import {createGenerateClassNameDefault} from './jss'
import * as symbols from './symbols'
import contextTypes from './contextTypes'
import propTypes from './propTypes'

export default class JssProvider extends Component {
  static propTypes = {
    ...propTypes,
    generateClassName: func,
    classNamePrefix: string,
    children: node.isRequired
  }

  static childContextTypes = contextTypes

  static contextTypes = contextTypes

  // JssProvider can be nested. We allow to overwrite any context prop at any level.
  // 1. Check if there is a value passed over props.
  // 2. If value was passed, we set it on the child context.
  // 3. If value was not passed, we proxy parent context (default context behaviour).
  getChildContext() {
    const {registry, classNamePrefix, jss: localJss, generateClassName} = this.props
    const sheetOptions = this.context[symbols.sheetOptions] || {}
    const context = {[symbols.sheetOptions]: sheetOptions}

    if (registry) {
      context[symbols.sheetsRegistry] = registry
      // This way we identify a new request on the server, because user will create
      // a new Registry instance for each.
      if (registry !== this.registry) {
        // We reset managers because we have to regenerate all sheets for the new request.
        this.managers = {}
        this.registry = registry
      }
    }

    // Make sure we don't loose managers when JssProvider is used inside of a stateful
    // component which decides to rerender.
    context[symbols.managers] = this.managers

    if (generateClassName) {
      sheetOptions.generateClassName = generateClassName
    }
    else if (!sheetOptions.generateClassName) {
      if (!this.generateClassName) {
        let createGenerateClassName = createGenerateClassNameDefault
        if (localJss && localJss.options.createGenerateClassName) {
          createGenerateClassName = localJss.options.createGenerateClassName
        }
        // Make sure we don't loose the generator when JssProvider is used inside of a stateful
        // component which decides to rerender.
        this.generateClassName = createGenerateClassName()
      }

      sheetOptions.generateClassName = this.generateClassName
    }

    if (classNamePrefix) sheetOptions.classNamePrefix = classNamePrefix
    if (localJss) context[symbols.jss] = localJss

    return context
  }

  render() {
    return Children.only(this.props.children)
  }
}

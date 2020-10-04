let createMetaDefinition = () => {
  return {
    either: [
      {
        type: 'function'
      },
      {
        type: 'string',
        enum: ['string', 'array', 'boolean', 'object', 'number', 'function']
      },
      {
        type: 'object',
        strict: true,
        schema: {
          ['type']: {
            type: 'string',
            enum: ['string', 'array', 'boolean', 'object', 'number', 'function']
          },
          ['require']: {
            type: 'array',
            items: 'string'
          },
          ['items']: createMetaDefinition,
          ['enum']: 'array',
          ['either']: {
            type: 'array',
            items: createMetaDefinition
          },
          ['schema']: {
            type: 'object',
            items: createMetaDefinition
          },
          ['strict']: 'boolean',
          ['default']: {}
        }
      }
    ]
  }
}

class Validator {
  constructor(definition, options = {}) {
    this.options = options

    if(!this.options.dontSelfValidate) {
      let aValidator = new Validator(createMetaDefinition(), {dontSelfValidate: true})
      try {
        aValidator.validate(definition, '@validator')
      }
      catch(err) {
        throw new Error(`Validation Definition Error: ${err}`)
      }
    }

    if(typeof definition === 'function') {
      definition = definition()
    }
    
    if(typeof definition === 'string') {
      definition = { type: definition }
    }

    this._definition = definition
  }

  validate(aValue, aValueName = '@value') {
    let $default = this._definition.default
    if($default) {
      if(aValue === undefined || aValue === null) {
        aValue = $default
      }
    }

    let type = this._definition.type
    if(type) {
      if(type === 'array') {
        if(!Array.isArray(aValue)) {
          throw new Error(`${aValueName} '${aValue}' is not 'array'`)
        }
      }
      else if(typeof aValue !== type) {
        throw new Error(`${aValueName} '${aValue}' is not '${type}'`)
      }
    }

    let schema = this._definition.schema
    if(schema) {
      let schemaKeys = Object.keys(schema)

      if(this._definition.strict) {
        let valueKeys = Object.keys(aValue)
        for(let i = 0; i < valueKeys.length; i++) {
          if(!schemaKeys.includes(valueKeys[i])) {
            throw new Error(`${aValueName}.${valueKeys[i]} is not declared`)
          }
        }
      }
      
      for(let i = 0; i < schemaKeys.length; i++) {
        let field = schemaKeys[i]
        if(aValue[field] !== undefined) {
          let aValidator = new Validator(schema[field], {dontSelfValidate: true})
          aValidator.validate(aValue[field], `${aValueName}.${field}`)
        }
      }
    }

    let require = this._definition.require
    if(require) {
      require.forEach(req => {
        if(aValue[req] === undefined) {
          throw new Error(`${aValueName}.${req} is 'undefined'`)
        }
      })
    }

    let items = this._definition.items
    if(items) {
      let aValidator = new Validator(items, {dontSelfValidate: true})
      if(Array.isArray(aValue)) {
        for(let i = 0; i < aValue.length; i++) {
          aValidator.validate(aValue[i], `${aValueName}[${i}]`)
        }
      }
      else {
        let keys = Object.keys(aValue)
        for(let i = 0; i < keys.length; i++) {
          aValidator.validate(aValue[keys[i]], `${aValueName}.${keys[i]}`)
        }
      }
    }

    let $enum = this._definition.enum
    if($enum) {
      if(!$enum.includes(aValue)) {
        throw new Error(`${aValueName} '${aValue}' is not in ${JSON.stringify($enum)}`)
      }
    }

    let either = this._definition.either
    if(either) {
      let errors = []
      let success = false
      for(let i = 0; !success && i < either.length; i++) {
        let definition = either[i]
        let aValidator = new Validator(definition, {dontSelfValidate: true})
        try {
          aValue = aValidator.validate(aValue, aValueName)
          success = true
        }
        catch (err) {
          errors.push([err])
        }
      }
      if(!success) {
        throw new Error(errors.map(err => err.toString()).join(' && '))
      }
    }

    return aValue
  }
}

module.exports = { Validator, createMetaDefinition }


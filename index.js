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
          ['default']: {},
          ['custom']: 'function',
          ['restrict']: {
            type: 'array',
            items: 'string'
          }
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
        throw new Error(`Definition Error: ${err.message}`)
      }
    }

    this.definition = definition
  }

  validate(aValue, aValueName = '@value') {
    let definition = this.definition
    if(typeof definition === 'function') {
      definition = definition()
    }
    if(typeof definition === 'string') {
      definition = { type: definition }
    }

    let $default = definition.default
    if($default) {
      if(aValue === undefined || aValue === null) {
        aValue = $default
      }
    }

    let type = definition.type
    if(type) {
      if(type === 'array') {
        if(!Array.isArray(aValue)) {
          throw new Error(`${aValueName} must be an array`)
        }
      }
      else if(typeof aValue !== type) {
        throw new Error(`${aValueName} must be a ${type}`)
      }
    }

    let schema = definition.schema
    if(schema) {
      let schemaKeys = Object.keys(schema)

      if(definition.strict) {
        let valueKeys = Object.keys(aValue)
        for(let i = 0; i < valueKeys.length; i++) {
          if(!schemaKeys.includes(valueKeys[i])) {
            throw new Error(`${aValueName}.${valueKeys[i]} must be undefined`)
          }
        }
      }
      
      for(let i = 0; i < schemaKeys.length; i++) {
        let field = schemaKeys[i]
        if(aValue[field] !== undefined) {
          let aValidator = new Validator(schema[field], {dontSelfValidate: true})
          aValue[field] = aValidator.validate(aValue[field], `${aValueName}.${field}`)
        }
      }
    }

    let require = definition.require
    if(require) {
      for(let i = 0; i < require.length; i++) {
        if(aValue[require[i]] === undefined) {
          throw new Error(`${aValueName}.${require[i]} can't be undefined`)
        }
      }
    }

    let items = definition.items
    if(items) {
      let aValidator = new Validator(items, {dontSelfValidate: true})
      if(Array.isArray(aValue)) {
        for(let i = 0; i < aValue.length; i++) {
          aValue[i] = aValidator.validate(aValue[i], `${aValueName}[${i}]`)
        }
      }
      else {
        let keys = Object.keys(aValue)
        for(let i = 0; i < keys.length; i++) {
          aValue[keys[i]] = aValidator.validate(aValue[keys[i]], `${aValueName}.${keys[i]}`)
        }
      }
    }

    let $enum = definition.enum
    if($enum) {
      if(!$enum.includes(aValue)) {
        throw new Error(`${aValueName} must be one of ${JSON.stringify($enum)}`)
      }
    }

    let either = definition.either
    if(either) {
      let errors = []
      let success = false
      for(let i = 0; !success && i < either.length; i++) {
        let definition = either[i]
        try {
          aValue = validate(aValue, definition, aValueName, {dontSelfValidate: true})
          success = true
        }
        catch (err) {
          errors.push(err)
        }
      }
      if(!success) {
        throw new Error(errors.map(err => err.message).join(' Or '))
      }
    }

    let custom = definition.custom
    if(custom) {
      aValue = custom(aValue)
    }

    let restrict = definition.restrict
    if(restrict) {
      for(let i = 0; i < restrict.length; i++) {
        if(aValue[restrict[i]] !== undefined) {
          throw new Error(`${aValueName}.${require[i]} must be undefined`)
        }
      }
    }

    return aValue
  }
}

function validate(value, definition, valueName = '@value', options = {}) {
  let aValidator = new Validator(definition, options)
  return aValidator.validate(value, valueName)
}

module.exports = { Validator, createMetaDefinition, validate }


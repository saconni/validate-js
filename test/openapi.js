let assert = require('assert');
const { Validator, createMetaDefinition, validate } = require('../index.js');

suite('openapi', () => {
  test('can generate openapi schema for strings', () => {
    let validator = new Validator({
      type: 'string'
    })

    let openApiSchema = {
      type: 'string'
    }

    assert.deepStrictEqual(openApiSchema, validator.getOpenApiSchema())
  })

  test('can generate openapi schema with enums strings', () => {
    let validator = new Validator({
      type: 'string',
      enum: ['yes', 'no']
    })

    let openApiSchema = {
      type: 'string',
      enum: ['yes', 'no']
    }

    assert.deepStrictEqual(openApiSchema, validator.getOpenApiSchema())
  })

  test('can generate openapi schema for objects', () => {
    let validator = new Validator({
      type: 'object',
      properties: {
        aField: 'string'
      }
    })

    let openApiSchema = {
      type: 'object',
      properties: {
        aField: {
          type: 'string'
        }
      }
    }

    assert.deepStrictEqual(openApiSchema, validator.getOpenApiSchema())
  })

  test('can generate openapi schema for arrays', () => {
    let validator = new Validator({
      type: 'array',
      items: {
        type: 'object',
        properties: {
          aField: 'string'
        }
      }
    })

    let openApiSchema = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          aField: {
            type: 'string'
          }
        }
      }
    }

    assert.deepStrictEqual(openApiSchema, validator.getOpenApiSchema())
  })

  test('can generate openapi schema with required properties', () => {
    let validator = new Validator({
      type: 'object',
      require: ['aField', 'anotherField'],
      properties: {
        aField: 'string',
        anotherField: 'number'
      }
    })
    
    let openApiSchema = {
      type: 'object',
      required: ['aField', 'anotherField'],
      properties: {
        aField: {
          type: 'string'
        },
        anotherField: {
          type: 'number'
        }
      }
    }

    assert.deepStrictEqual(openApiSchema, validator.getOpenApiSchema())
  })

})
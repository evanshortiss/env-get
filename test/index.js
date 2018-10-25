'use strict'

/* eslint-env mocha */

var expect = require('chai').expect

describe('env-var', function () {
  // Some default env vars for tests
  var TEST_VARS = {
    VALID_BASE_64: 'aGVsbG8=', // "hello" in base64
    INVALID_BASE_64: 'a|GV-sb*G8=',
    STRING: 'oh hai',
    FLOAT: '12.43',
    INTEGER: '5',
    BOOL: 'false',
    JSON: '{"name":"value"}',
    JSON_OBJECT: '{"name":"value"}',
    JSON_ARRAY: '[1,2,3]',
    COMMA_ARRAY: '1,2,3',
    DASH_ARRAY: '1-2-3',
    URL: 'http://google.com',
    ENUM: 'VALID'
  }

  var mod = require('../env-var.js')

  beforeEach(function () {
    // Inject our dummy vars
    Object.keys(TEST_VARS).forEach(function (key) {
      process.env[key] = TEST_VARS[key]
    })
  })

  describe('getting process.env', function () {
    it('should return process.env object when no args provided', function () {
      var res = mod.get()

      expect(res).to.be.an('object');

      ['STRING', 'FLOAT', 'INTEGER', 'BOOL', 'JSON'].forEach(function (name) {
        expect(res[name]).to.not.equal(undefined)
      })
    })
  })

  describe('default values', function () {
    it('should return the default', function () {
      const ret = mod.get('XXX_NOT_DEFINED', 'default').asString()

      expect(ret).to.equal('default')
    })
  })

  describe('#convertFromBase64', function () {
    it('should return a value from a converted base64 string', function () {
      const res = mod.get('VALID_BASE_64').convertFromBase64().asString()

      expect(res).to.be.a('string')
      expect(res).to.equal('hello')
    })

    it('should throw an error due to malformed base64', function () {
      expect(() => {
        mod.get('INVALID_BASE_64').convertFromBase64().asString()
      }).throw(/"INVALID_BASE_64" should be a valid base64 string if using convertFromBase64, but was "a|GV-sb*G8="/g)
    })
  })

  describe('#asEnum', function () {
    it('should return a string', function () {
      expect(mod.get('ENUM').asEnum(['VALID'])).to.be.a('string')
      expect(mod.get('ENUM').asEnum(['VALID'])).to.equal('VALID')
    })

    it('should throw when value is not expected', function () {
      expect(() => {
        expect(mod.get('ENUM').asEnum(['INVALID']))
      }).to.throw('env-var: "ENUM" should be a one of [INVALID], but was "VALID"')
    })
  })

  describe('#asString', function () {
    it('should return a string', function () {
      expect(mod.get('STRING').asString()).to.be.a('string')
      expect(mod.get('STRING').asString()).to.equal(TEST_VARS.STRING)
    })
  })

  describe('#asUrlString', function () {
    it('should return a url string', function () {
      expect(mod.get('URL').asUrlString()).to.be.a('string')
      expect(mod.get('URL').asUrlString()).to.equal(TEST_VARS.URL)
    })

    it('should throw due to bad url', function () {
      process.env.URL = 'not a url'

      expect(() => {
        mod.get('URL').asUrlString()
      }).to.throw('env-var: "URL" should be a valid URL, but was "not a url"')
    })
  })

  describe('#asUrlObject', function () {
    it('should return a url object', function () {
      expect(mod.get('URL').asUrlObject()).to.be.a('object')
      expect(mod.get('URL').asUrlObject()).to.deep.equal(require('url').parse(process.env.URL))
    })

    it('should throw due to bad url', function () {
      process.env.URL = 'not a url'

      expect(() => {
        mod.get('URL').asUrlObject()
      }).to.throw('env-var: "URL" should be a valid URL, but was "not a url"')
    })
  })

  describe('#asInt', function () {
    it('should return an integer', function () {
      expect(mod.get('INTEGER').asInt()).to.be.a('number')
      expect(mod.get('INTEGER').asInt()).to.equal(parseInt(TEST_VARS.INTEGER))
    })

    it('should throw an exception - non integer type found', function () {
      process.env.INTEGER = '1.2'

      expect(function () {
        mod.get('INTEGER').asInt()
      }).to.throw()
    })

    it('should throw an exception - non integer type found', function () {
      process.env.INTEGER = 'nope'

      expect(function () {
        mod.get('INTEGER').asInt()
      }).to.throw()
    })
  })

  describe('#asIntPositive', function () {
    it('should return a positive integer', function () {
      expect(mod.get('INTEGER').asIntPositive()).to.be.a('number')
      expect(mod.get('INTEGER').asIntPositive()).to.equal(parseInt(TEST_VARS.INTEGER))
    })

    it('should throw an exception - negative integer found', function () {
      process.env.INTEGER = '-10'

      expect(function () {
        mod.get('INTEGER').asIntPositive()
      }).to.throw()
    })
  })

  describe('#asIntNegative', function () {
    it('should return a negative integer', function () {
      process.env.INTEGER = '-10'
      expect(mod.get('INTEGER').asIntNegative()).to.be.a('number')
      expect(mod.get('INTEGER').asIntNegative()).to.equal(parseInt(-10))
    })

    it('should throw an exception - positive integer found', function () {
      expect(function () {
        mod.get('INTEGER').asIntNegative()
      }).to.throw()
    })
  })

  describe('#asFloat', function () {
    it('should return a float', function () {
      expect(mod.get('FLOAT').asFloat()).to.be.a('number')
      expect(mod.get('FLOAT').asFloat()).to.equal(parseFloat(TEST_VARS.FLOAT))
    })

    it('should throw an exception - non float found', function () {
      process.env.FLOAT = 'nope'

      expect(function () {
        mod.get('FLOAT').asFloat()
      }).to.throw()
    })
  })

  describe('#asFloatPositive', function () {
    it('should return a positive float', function () {
      expect(mod.get('FLOAT').asFloatPositive()).to.be.a('number')
      expect(mod.get('FLOAT').asFloatPositive()).to.equal(parseFloat(TEST_VARS.FLOAT))
    })

    it('should throw an exception - negative integer found', function () {
      process.env.FLOAT = `-${process.env.FLOAT}`

      expect(function () {
        mod.get('FLOAT').asFloatPositive()
      }).to.throw()
    })
  })

  describe('#asFloatNegative', function () {
    it('should return a negative float', function () {
      const numberString = `-${TEST_VARS.FLOAT}`
      process.env.FLOAT = numberString
      expect(mod.get('FLOAT').asFloatNegative()).to.be.a('number')
      expect(mod.get('FLOAT').asFloatNegative()).to.equal(parseFloat(numberString))
    })

    it('should throw an exception - positive integer found', function () {
      expect(function () {
        mod.get('FLOAT').asFloatNegative()
      }).to.throw()
    })
  })

  describe('#asBool', function () {
    it('should return a bool - for string "false"', function () {
      expect(mod.get('BOOL').asBool()).to.be.a('boolean')
      expect(mod.get('BOOL').asBool()).to.equal(false)
    })

    it('should return a bool - for string "FALSE"', function () {
      process.env.BOOL = 'FALSE'
      expect(mod.get('BOOL').asBool()).to.be.a('boolean')
      expect(mod.get('BOOL').asBool()).to.equal(false)
    })

    it('should return a bool - for string "0"', function () {
      process.env.BOOL = '0'
      expect(mod.get('BOOL').asBool()).to.be.a('boolean')
      expect(mod.get('BOOL').asBool()).to.equal(false)
    })

    it('should return a bool - for integer 0', function () {
      process.env.BOOL = 0
      expect(mod.get('BOOL').asBool()).to.be.a('boolean')
      expect(mod.get('BOOL').asBool()).to.equal(false)
    })

    it('should return a bool - for string "true"', function () {
      process.env.BOOL = 'true'
      expect(mod.get('BOOL').asBool()).to.be.a('boolean')
      expect(mod.get('BOOL').asBool()).to.equal(true)
    })

    it('should return a bool - for string "TRUE"', function () {
      process.env.BOOL = 'TRUE'
      expect(mod.get('BOOL').asBool()).to.be.a('boolean')
      expect(mod.get('BOOL').asBool()).to.equal(true)
    })

    it('should return a bool - for string "1"', function () {
      process.env.BOOL = '1'
      expect(mod.get('BOOL').asBool()).to.be.a('boolean')
      expect(mod.get('BOOL').asBool()).to.equal(true)
    })

    it('should return a bool - for integer 1', function () {
      process.env.BOOL = 1
      expect(mod.get('BOOL').asBool()).to.be.a('boolean')
      expect(mod.get('BOOL').asBool()).to.equal(true)
    })

    it('should throw an exception - invalid boolean found', function () {
      process.env.BOOL = 'nope'

      expect(function () {
        mod.get('BOOL').asBool()
      }).to.throw()
    })
  })

  describe('#asBoolStrict', function () {
    it('should return a bool - for string "false"', function () {
      expect(mod.get('BOOL').asBoolStrict()).to.be.a('boolean')
      expect(mod.get('BOOL').asBoolStrict()).to.equal(false)
    })

    it('should return a bool - for string "FALSE"', function () {
      process.env.BOOL = 'FALSE'
      expect(mod.get('BOOL').asBoolStrict()).to.be.a('boolean')
      expect(mod.get('BOOL').asBoolStrict()).to.equal(false)
    })

    it('should throw an exception - for string "0"', function () {
      process.env.BOOL = '0'

      expect(function () {
        mod.get('BOOL').asBoolStrict()
      }).to.throw()
    })

    it('should throw an exception - for integer 0', function () {
      process.env.BOOL = 0

      expect(function () {
        mod.get('BOOL').asBoolStrict()
      }).to.throw()
    })

    it('should return a bool - for string "true"', function () {
      process.env.BOOL = 'true'
      expect(mod.get('BOOL').asBoolStrict()).to.be.a('boolean')
      expect(mod.get('BOOL').asBoolStrict()).to.equal(true)
    })

    it('should return a bool - for string "TRUE"', function () {
      process.env.BOOL = 'TRUE'
      expect(mod.get('BOOL').asBoolStrict()).to.be.a('boolean')
      expect(mod.get('BOOL').asBoolStrict()).to.equal(true)
    })

    it('should throw an exception - for string "1"', function () {
      process.env.BOOL = '1'

      expect(function () {
        mod.get('BOOL').asBoolStrict()
      }).to.throw()
    })

    it('should throw an exception - for integer 1', function () {
      process.env.BOOL = 1

      expect(function () {
        mod.get('BOOL').asBoolStrict()
      }).to.throw()
    })

    it('should throw an exception - invalid boolean found', function () {
      process.env.BOOL = 'nope'

      expect(function () {
        mod.get('BOOL').asBoolStrict()
      }).to.throw()
    })
  })

  describe('#asJson', function () {
    it('should return a json object', function () {
      expect(mod.get('JSON').asJson()).to.be.an('object')
      expect(mod.get('JSON').asJson()).to.deep.equal(JSON.parse(TEST_VARS.JSON))
    })

    it('should throw an exception - json parsing failed', function () {
      process.env.JSON = '{ nope}'

      expect(function () {
        mod.get('JSON').asJson()
      }).to.throw()
    })
  })

  describe('#required', function () {
    it('should not throw if required and found', function () {
      expect(mod.get('JSON').required().asJson()).to.be.an('object')
    })

    it('should throw an exception when required, but not set', function () {
      delete process.env.JSON

      expect(function () {
        mod.get('JSON').required().asJson()
      }).to.throw()
    })

    it('should return undefined when not set and not required', function () {
      delete process.env.STRING

      expect(mod.get('STRING').asString()).to.equal(undefined)
    })
  })

  describe('#asJsonArray', function () {
    it('should return undefined', function () {
      expect(
        mod.get('nope').asJsonArray()
      ).to.equal(undefined)
    })

    it('should throw an error - value was an object', function () {
      expect(function () {
        mod.get('JSON_OBJECT').asJsonArray()
      }).to.throw()
    })

    it('should return a JSON Array', function () {
      expect(
        mod.get('JSON_ARRAY').asJsonArray()
      ).to.deep.equal([1, 2, 3])
    })
  })

  describe('#asJsonObject', function () {
    it('should throw an exception', function () {
      expect(
        mod.get('nope').asJsonObject()
      ).to.equal(undefined)
    })

    it('should throw an error - value was an array', function () {
      expect(function () {
        mod.get('JSON_ARRAY').asJsonObject()
      }).to.throw()
    })

    it('should return a JSON Object', function () {
      expect(
        mod.get('JSON_OBJECT').asJsonObject()
      ).to.deep.equal({name: 'value'})
    })
  })

  describe('#asArray', function () {
    it('should return undefined when not set', function () {
      expect(mod.get('.NOPE.').asArray()).to.equal(undefined)
    })

    it('should raise an error if set incorrectly', function () {
      process.env.COMMA_ARRAY = ''

      expect(() => {
        mod.get('COMMA_ARRAY').asArray()
      }).to.throw('should include values separated with the delimeter ","')
    })

    it('should return an array that was split on commas', function () {
      expect(mod.get('COMMA_ARRAY').asArray()).to.deep.equal(['1', '2', '3'])
    })

    it('should return an array that was split on dashes', function () {
      expect(mod.get('DASH_ARRAY').asArray('-')).to.deep.equal(['1', '2', '3'])
    })
  })

  describe('#mock', function () {
    var mockMod

    beforeEach(function () {
      mockMod = mod.mock({
        A_BOOL: 'true',
        A_STRING: 'blah'
      })
    })

    it('should get a mock boolean', function () {
      expect(mockMod.get('A_BOOL').required().asBool()).to.eql(true)
    })

    it('should get a mock string', function () {
      expect(mockMod.get('A_STRING').required().asString()).to.eql('blah')
    })

    it('should get undefined for a missing un-required value', function () {
      expect(mockMod.get('DONTEXIST').asString()).to.eql(undefined)
    })

    it('should throw an exception on a missing required value', function () {
      expect(function () {
        mockMod.get('DONTEXIST').required().asJson()
      }).to.throw()
    })

    it('should return the mock values object if no arguments', function () {
      expect(mockMod.get()).to.have.property('A_BOOL', 'true')
      expect(mockMod.get()).to.have.property('A_STRING', 'blah')
    })
  })
})

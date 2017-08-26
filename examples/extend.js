/**
 * @file extend.js
 * @description
 * This example demonstrates how to use
 * `extend` option.
 */

import mongoose from 'mongoose';
import {
  GraphQLList,
  GraphQLString,
} from 'graphql';
import mongooseGraphQLTransform from '../build';

// Create basic Mongoose schema
const AnimalMongoose = new mongoose.Schema({
  name: { type: String },
  age: { type: Number },
});

// Convert schema to GraphQL type
const AnimalGraphQL = mongooseGraphQLTransform({
  // Specify a name
  name: 'Animal',

  // Specify the description
  description: 'Type which represents an animal',

  // Specify the name of the GraphQL class
  class: 'GraphQLObjectType',

  // Specify the Mongoose schema
  schema: AnimalMongoose,

  // Say that it is needed resulting GraphQL type to
  // have a few more fields.
  extend: {
    // Animals also have problems
    problems: {
      type: new GraphQLList(GraphQLString),
    },
  },
});

module.exports = () => {
  console.log('Mongoose schema: ', AnimalMongoose);
  console.log(
    'Generated GraphQL type:',
    AnimalGraphQL,
  );
};

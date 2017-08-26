/**
 * @file basic.js
 * @description
 * This example shows how to use the `exclude`
 * option.
 */

import mongoose from 'mongoose';
import mongooseGraphQLTransform from '../build';

// Create basic Mongoose schema
const AnimalMongoose = new mongoose.Schema({
  name: { type: String },
  age: { type: Number },

  // Password? Really? (Animal)
  password: { type: String },
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

  // Say that we don't need to have `password` field
  // to be in the resulting GraphQL type.
  exclude: ['password'],
});

module.exports = () => {
  console.log('Mongoose schema: ', AnimalMongoose);
  console.log(
    'Generated GraphQL type:',
    AnimalGraphQL,
  );
};

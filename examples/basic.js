/**
 * @file basic.js
 * @description
 * This example shows how to use the library
 * at basic level.
 */

import mongoose from 'mongoose';
import mongooseGraphQLTransform from '../build'

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
});

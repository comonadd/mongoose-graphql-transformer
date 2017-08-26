import mongoose from 'mongoose';
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLInt,
} from 'graphql';

import mongooseSchemaToGraphQL, {
  generateNameForSubField,
  generateDescriptionForSubField,
} from '..';

import {
  getRidOfThunks,
} from './util';

test('generates schemas with arrays correctly', () => {
  const NAME = 'ArrayTestSchema';
  const DESCRIPTION = 'Testing';

  const WhateverSchema = new mongoose.Schema({
    a: Number,
    b: Number,
  });

  const Schema = new mongoose.Schema({
    something: String,
    whatever: [WhateverSchema],
  });

  const ExpectedType = getRidOfThunks(
    mongooseSchemaToGraphQL({
      name: NAME,
      class: 'GraphQLObjectType',
      description: DESCRIPTION,
      schema: Schema,
      exclude: ['_id'],
    }),
  );

  const ReceivedType = getRidOfThunks(
    (new GraphQLObjectType({
      name: NAME,
      description: DESCRIPTION,
      fields: () => ({
        something: { type: GraphQLString },
        whatever: {
          type: new GraphQLList(new GraphQLObjectType({
            name: generateNameForSubField(NAME, 'whatever'),
            description: generateDescriptionForSubField(NAME, 'whatever'),
            fields: () => ({
              a: { type: GraphQLInt },
              b: { type: GraphQLInt },
            }),
          })),
        },
      }),
    })),
  );

  expect(ExpectedType).toEqual(ReceivedType);
});

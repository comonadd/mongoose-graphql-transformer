import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from 'graphql';

const possibleGraphQLClasses = {
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLEnumType,
};

/**
 * @summary Set the function name property.
 */
const setFnName = (fn, name) =>
  Object.defineProperty(fn, 'name', { value: name });

/**
 * @summary
 * Generate name for a sub-field of a type with a given name.
 *
 * @param {String} rootTypeName - The name of the root type.
 * @param {String} subFieldKeyname - The name of the sub-field in
 * a Mongoose schema (path).
 *
 * @return {String}
 */
export const generateNameForSubField = (rootTypeName, subFieldKeyName) =>
  `${rootTypeName}_${subFieldKeyName}`;

/**
 * @summary
 * Generate description for a sub-field of a type with a given name.
 *
 * @param {String} rootTypeName - The name of the root type.
 * @param {String} subFieldKeyname - The name of the sub-field in
 * a Mongoose schema (path).
 *
 * @return {String}
 */
export const generateDescriptionForSubField = (rootTypeName, subFieldKeyName) =>
  `${rootTypeName}'s '${subFieldKeyName}' sub-field`;

/**
 * @summary
 * Convert the primitive object Mongoose instance
 * name to the GraphQL type instance.
 */
const convertPrimitiveObjectInstanceToGraphQLType = (instanceName) => {
  switch (instanceName) {
    case 'ObjectID':
    case 'String':
    case 'Date':
    case 'Mixed': return GraphQLString;
    case 'Boolean':
    case 'Buffer': return GraphQLBoolean;
    case 'Number': return GraphQLInt;
    default: throw new Error(
      `unknown primitive object instance name: "${instanceName}"`,
    );
  }
};

/**
 * @summary
 * Generate the GraphQL type using given GraphQL type class
 * and the configuration for that type class.
 */
const generateGraphQLType = (typeClass, config) =>
  new possibleGraphQLClasses[typeClass](config);

/**
 * @summary
 * Check passed arguments for errors.
 */
const checkArgsForErrors = (args) => {
  if (!args) {
    throw new Error('options are required');
  }

  if (!args.schema) {
    throw new Error('`schema` option *should* be provided');
  }

  if (!args.schema.paths) {
    throw new Error('`schema` option should be a valid mongoose.Schema instance');
  }

  if (!args.name) {
    throw new Error('`name` option *should* be provided');
  }

  if (!args.class) {
    throw new Error('`class` option is required');
  }

  if (Object.keys(possibleGraphQLClasses).indexOf(args.class) === -1) {
    throw new Error('invalid `class` option specified');
  }
};

/**
 * @summary
 * Parse given arguments object.
 */
const parseArgs = (args) => {
  checkArgsForErrors(args);
  const res = args;
  res.exclude = args.exclude || [];
  res.extend = args.extend || {};
  res.props = args.props || {};
  return res;
};

/**
 * @summary
 * The already-generated types memory.
 */
const generatedTypesMemory = {};

/**
 * @summary
 * Memoize given type with a given name.
 */
const memoize = (name, resultingGraphQLType) => {
  if (generatedTypesMemory[name]) {
    throw new Error('attempt to create GraphQL type with already existing name');
  }

  generatedTypesMemory[name] = resultingGraphQLType;
};

/**
 * @summary Retrieve type from the memory by name.
 */
const getFromMemory = name => generatedTypesMemory[name];

const createType = (args) => {
  const parsedArgs = parseArgs(args);

  // Check if this type is already memoized
  const alreadyGeneratedType = getFromMemory(parsedArgs.name);
  if (alreadyGeneratedType) return alreadyGeneratedType;

  // The resulting object which would be passed to the
  // constructor of the new GraphQL type.
  const resultingGraphQLOptions = {
    name: parsedArgs.name,
    description: parsedArgs.description,
    fields: () => ({}),
  };

  // The resulting GraphQL type.
  let resultingGraphQLType = null;

  const rootSchemaPaths = parsedArgs.schema.paths;

  const setResultingTypeField = (key, val) => {
    const oldFields = resultingGraphQLOptions.fields;
    resultingGraphQLOptions.fields = () => Object.assign(
      {},
      oldFields(),
      { [key]: val },
    );
  };

  const setResultingTypeFieldFn = (key, val) => {
    const oldFields = resultingGraphQLOptions.fields;
    resultingGraphQLOptions.fields = () => Object.assign(
      {},
      oldFields(),
      { [key]: val() },
    );
  };

  const extendResultingTypeField = (newFields) => {
    const oldFields = resultingGraphQLOptions.fields;
    resultingGraphQLOptions.fields = () => Object.assign(
      {},
      oldFields(),
      (typeof newFields === 'function') ? newFields() : newFields,
    );
  };

  Object
    .keys(rootSchemaPaths)
    .filter(pathName => parsedArgs.exclude.indexOf(pathName) === -1)
    .forEach((pathName) => {
      const path = rootSchemaPaths[pathName];

      // If path points to another object
      // (this is called "population" in Mongoose)
      if (path.caster && path.caster.options && path.caster.options.ref) {
        // Get the type of the pointer
        const refTypeName = path.caster.options.ref;

        setResultingTypeFieldFn(
          pathName,
          () => {
            // Get the type from the memory
            const refGraphQLType = getFromMemory(refTypeName);

            if (!refGraphQLType) {
              throw new Error(
                `
type with name "${refTypeName}" doesn't exist,
but was specified as population reference.
*NOTE*: This error was thrown while creating "${parsedArgs.name}" GraphQL type.
`,
              );
            }

            return {
              type: refGraphQLType,
            };
          },
        );

        // Go to the next path
        return;
      }

      const pathInstanceName = path.instance;

      // If the field represents another user-defined schema
      if (pathInstanceName === 'Embedded') {
        if (parsedArgs.schema === path.schema) {
          setResultingTypeFieldFn(pathName, () => ({
            type: resultingGraphQLType,
          }));
        } else {
          setResultingTypeField(
            pathName,
            {
              type: createType({
                name: generateNameForSubField(resultingGraphQLOptions.name, pathName),
                description: generateDescriptionForSubField(
                  resultingGraphQLOptions.name,
                  pathName,
                ),
                class: parsedArgs.class,
                schema: path.schema,
                exclude: parsedArgs.exclude,
              }),
            },
          );
        }

        // Go to the next path
        return;
      }

      // If the field represents an array
      if (pathInstanceName === 'Array') {
        if (path.schema) {
          // This is the array which contains other user-defined schema
          if (parsedArgs.schema === path.schema) {
            // If the array contains the same type.
            setResultingTypeFieldFn(
              pathName,
              () => ({
                type: new GraphQLList(resultingGraphQLType),
              }),
            );
          } else {
            setResultingTypeField(
              pathName,
              {
                type: new GraphQLList(createType({
                  name: generateNameForSubField(resultingGraphQLOptions.name, pathName),
                  description: generateDescriptionForSubField(
                    resultingGraphQLOptions.name,
                    pathName,
                  ),
                  class: parsedArgs.class,
                  schema: path.schema,
                  exclude: parsedArgs.exclude,
                })),
              },
            );
          }
        } else {
          const arrayElementInstanceName = path.caster.instance;
          const resType = new GraphQLList(
            convertPrimitiveObjectInstanceToGraphQLType(
              arrayElementInstanceName));

          setResultingTypeField(pathName, { type: resType });
        }

        // Go to the next path
        return;
      }

      // If we are reached this point, that means that
      // the field is of a primitive type.
      setResultingTypeField(
        pathName,
        {
          type: convertPrimitiveObjectInstanceToGraphQLType(pathInstanceName),
        },
      );
    });

  // Extend the resulting type configuration with the given fields
  extendResultingTypeField(parsedArgs.extend);
  extendResultingTypeField(parsedArgs.props);

  setFnName(resultingGraphQLOptions.fields, 'fields');

  resultingGraphQLType = generateGraphQLType(
    parsedArgs.class,
    resultingGraphQLOptions,
  );

  // Memoize
  memoize(parsedArgs.name, resultingGraphQLType);

  return resultingGraphQLType;
};

export default createType;

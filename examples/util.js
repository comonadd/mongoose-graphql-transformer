import colors from 'colors/safe';

export const printExampleBanner = (exampleName) => {
  const boxBorderWithoutColors = '+++';
  const boxBorder = colors.green(boxBorderWithoutColors);
  const boxInnerMsg = `Running "${exampleName}" example`;
  const boxLeftSpace = Array(
    ...{ length: boxInnerMsg.length + 4 },
  ).map(() => ' ').join('');
  const boxRightSpace = boxLeftSpace;
  const boxMiddleRow = `${boxBorder}${boxLeftSpace}${boxInnerMsg}${boxRightSpace}${boxBorder}`;
  const line = colors.green(Array(
    ...{
      length: boxLeftSpace.length +
              boxInnerMsg.length +
              boxRightSpace.length +
              (boxBorderWithoutColors.length * 2),
    }
  ).map(() => '+').join(''));

  console.log();
  console.log(line);
  console.log(boxMiddleRow);
  console.log(line);
  console.log();
};

export default {
  printExampleBanner,
};

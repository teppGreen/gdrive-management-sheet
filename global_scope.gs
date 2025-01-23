/** 
function外で定義されている変数は「グローバルスコープ」といい、このGASプロジェクトの中のどこからでも参照できます。
このGASプロジェクトの中のいずれかのfunctionを実行すると、グローバルスコープ部分から実行されます。
*/

const scriptProperties = PropertiesService.getScriptProperties(); //スクリプトプロパティにある値をとりあえず全部取得
const ss = SpreadsheetApp.getActiveSpreadsheet();
const SHARED_DRIVE_ID = searchRightSideValueInSheet('SHARED_DRIVE_ID',ss.getSheetByName('about'))[0];
const MAX_EXECUTION_TIME = searchRightSideValueInSheet('MAX_EXECUTION_TIME',ss.getSheetByName('about'))[0];

let startTime = new Date().getTime(); //スクリプトの開始時刻を定義
function checkExecutionTime() { //実行時間が超過していたらTRUEを返します。
  const returnValue = (new Date().getTime() - startTime) > MAX_EXECUTION_TIME;
  if(returnValue) console.error('[' + arguments.callee.name + '] ' + 'Processing time exceeded the upper limit.');
  return returnValue;
}

function searchRightSideValueInSheet(targetValue,sheet) { //targetValueの1つ右の値を取得
  let value = sheet.createTextFinder(targetValue).matchEntireCell(true).findAll();
    value = value.map(range => range.offset(0,1).getValue());
  console.log('[' + arguments.callee.name + '] ' + targetValue + ': ' + value);
  return value;
}

function doesExistsValueInSheet(targetValue, sheet, range) {
  let result = new Array();
  const dataRange = sheet.getRange(range); // 指定された範囲を取得
  const data = dataRange.getValues(); // シートのデータを2次元配列として取得
  const value = Array.isArray(targetValue) ? targetValue : [targetValue];

  for (let h = 0; h < value.length; h++) {
    result[h] = false;
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].length; j++) {
        if (data[i][j] === value[h]) {
          console.info('[' + arguments.callee.name + '] ' + '"' + value[h] + '" already exists.');
          result[h] =  true; //一致する値が見つかったらtrueを返す
          break;
        }
      }
      if(result[h]) break;
    }
  }

  return result;
}

function arrayIndex(array) {
  if (array) {
    for (let i = 0; i < array.length; i++) {
      if (typeof array[i] === 'string') {
        console.log('[' + arguments.callee.name + '] ' + i);
        return i;
      }
    }
    console.log('[' + arguments.callee.name + '] ' + -1);
  }
  return -1;
}
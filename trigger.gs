//実行メニューを作成
function  createMenu() {
  var ui = SpreadsheetApp.getUi();
  var menu = ui.createMenu("GASメニュー");
  menu.addItem("ファイル/フォルダの共有先を出力", "getContentMembers");
  menu.addItem("ドライブのメンバーを更新", "getDriveMembers");
  menu.addItem("共有ドライブのファイル一覧を更新", "settingTrigger_listContents");
  menu.addToUi();
}

function setTrigger(functionName) {
  const triggers = ScriptApp.getProjectTriggers();
  
  for (let i = 0; i < triggers.length; i++) {
    let trigger = triggers[i];
    if (trigger.getHandlerFunction() == functionName) {
      console.log('トリガー: ' + functionName + 'は既に存在します。');
      return;
    }
  }

  console.log('トリガー: ' + functionName + 'は存在しません。');
  var currentTime = new Date(); // 現在の時刻を取得
  var oneMinuteLater = new Date(currentTime.getTime() + 60 * 1000); // 1分後の時刻を計算 60秒 × 1000ミリ秒
  ScriptApp.newTrigger(functionName).timeBased().at(oneMinuteLater).create(); // トリガーをセット

  console.log(functionName + 'のトリガーをセットしました。' + oneMinuteLater + 'に作動します。');
  return;
}
 
function deleteTrigger(functionName) {
  const triggers = ScriptApp.getProjectTriggers();
  for(const trigger of triggers){
    if(trigger.getHandlerFunction() == functionName){
      ScriptApp.deleteTrigger(trigger);
      console.log('トリガー: ' + functionName + 'を削除しました。')
      return;
    }
  }
}

function settingTrigger_listContents() {
  if(!scriptProperties.getProperty('process_status')){
    result = Browser.msgBox('実行確認','現在contentsタブに入力されているデータをクリアし、はじめから処理を実行します。よろしいですか？', Browser.Buttons.YES_NO);
    if (result !== 'yes') {
      ss.toast('処理を中断しました');
      return;
    }
  }
  
  setTrigger('listContents');
  ss.toast('画面は閉じても構いません。かなり時間がかかるのでゆっくりお待ちくださいませ〜','処理を開始しました');
}
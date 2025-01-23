function getDriveMembers() {
  let members = [];
  
  const sheet = ss.getSheetByName('members_drive');
  const prm_list = Drive.Permissions.list(SHARED_DRIVE_ID,{supportsAllDrives: true});
  members.push(["Name", "E-mail address", "Organization", "Role", "Type", "Delated"]);
  
  for (let i = 0; i < prm_list.items.length; i++) {
    let prm_info = prm_list.items[i];
    members.push([prm_info.name, prm_info.emailAddress, prm_info.domain, prm_info.role, prm_info.type, prm_info.deleted]);
  }

  sheet.clearContents();
  sheet.getRange(1, 1, members.length, members[0].length).setValues(members);
  return members;
}

function getContentMembers() {
  let members = [];

  const sheet = ss.getSheetByName("members_content");
  const url = Browser.inputBox("URL", "Google ドライブのファイル/フォルダの共有URLを入力してください。", Browser.Buttons.OK);
    if(url=="cancel") return;
  
  // スプレッドシートにローディングアニメーションを表示
  const loadingHtml = HtmlService.createHtmlOutputFromFile('loadingAnimation').setWidth(400).setHeight(300);
  SpreadsheetApp.getUi().showModalDialog(loadingHtml, "処理中");

  sheet.clearContents();

  if(url === "") return;
  const id = extractDriveIdFromUrl(url);
  console.log('Process content ID: ' + id);

  let content = '';
  if(url.match('folder') !== null){
    content = DriveApp.getFolderById(id);
  } else {
    content = DriveApp.getFileById(id);
  }

  // フォルダまたはファイルの所有者、編集者、閲覧者を取得
  var [owner, editors, viewers] = [content.getOwner(), content.getEditors(), content.getViewers()];

  if (owner !== null) members.push([owner.getName(), owner.getEmail(), owner.getDomain(), 'owner']);

  // 編集者の情報をmembersに追加
  for (var i = 0; i < editors.length; i++) {
    var editor = editors[i];
    members.push([editor.getName(), editor.getEmail(), editor.getDomain(), content.getAccess(editor)]);
  }

  // 閲覧者の情報をmembersに追加
  for (var i = 0; i < viewers.length; i++) {
    var viewer = viewers[i];
    members.push([viewer.getName(), viewer.getEmail(), viewer.getDomain(), content.getAccess(viewer)]);
  }

  //一般的なアクセス（PRIVATE,DOMAIN_WITH_LINK,DOMAIN,ANYONE_WITH_LINK,ANYONE）
  sheet.appendRow([content.getName(), url, 'General access', content.getSharingAccess(), content.getSharingPermission()]);
  sheet.appendRow(['Name', 'E-mail address', 'Organization', 'Role']);
  sheet.getRange(3, 1, members.length, 4).setValues(members);

   //ローディングアニメーションを閉じる
  var closeLoadingHtml = HtmlService.createHtmlOutput('<script>google.script.host.close()</script>');
  SpreadsheetApp.getUi().showModalDialog(closeLoadingHtml, 'Closing dialog...');

  console.log("共有メンバーの情報がスプレッドシートに書き出されました。");
  return;
}

// Google ドライブのフォルダURLからフォルダIDを取得
function extractDriveIdFromUrl(url) {
  // 正規表現を使用してURLからIDを抽出
  var urlPattern = /\/(?:presentation\/d\/|spreadsheets\/d\/|file\/d\/|open\?url=|drive\/folders\/|document\/d\/)([\w-]+)/;
  var match = url.match(urlPattern);
  
  if (match && match[1]) {
    return match[1];
  } else {
    SpreadsheetApp.getUi.alert("ファイルIDを抽出できませんでした。指定したURLがGoogle ドライブのファイル/フォルダかを確かめてください。");
    return null;
  }
}

function extractionTest(){
  var testUrl = "https://drive.google.com/drive/folders/0AD04myleuNShUk9PVA";

  // ファイルIDを抽出して表示
  var fileId = extractDriveIdFromUrl(testUrl);
  console.log("URL:", testUrl);
  console.log("File ID:", fileId);
}
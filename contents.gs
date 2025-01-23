// lastModified: 2024-01-21 22:44:00
// 'listContents'を実行
// シートのデータをリセットして検索をやり直す場合は'resetProcessProperties'を実行
// 参考記事: https://blog.cloudnative.co.jp/19298/

let writeData = new Array();
let continuationToken_folder = JSON.parse(PropertiesService.getScriptProperties().getProperty("continuationToken_folder")); //前回記録したもの
let continuationToken_folder_next = []; //次回のために記録するもの（配列）
let restartFolderPath = JSON.parse(PropertiesService.getScriptProperties().getProperty("restartFolderPath"));
let restartFolderPath_next = []; //初期化

function listContents() {
  const sheet = ss.getSheetByName("contents"); //シートをグローバルスコープで定義したIDとシート名で取得
  sheet.getRange('A1:1').setBackground('#f61067');
  deleteTrigger('listContents'); //前回のトリガーを削除

  scriptProperties.deleteProperty('continuationToken_folder');
  scriptProperties.deleteProperty('restartFolderPath');

  const driveMembersEmail = getDriveMembers().slice(1).map(row => row[1]);
  const restartFolderId = scriptProperties.getProperty('restartFolderId');
    scriptProperties.deleteProperty('restartFolderId');
  let rootFolder, rootFolderPath;

  if (!restartFolderId) {
    sheet.clearContents(); //シートの情報をクリア（元々入力されていた情報が消える）
    sheet.appendRow([
      'path', 'name', 'type', 'url', 'id', 'editor', 'viewer', 'genAccess', 'genPermission', 'isShareableByEditors', 'createdDate', 'modifiedDate', 'size', 'discription', 'resourceKey'
    ]); //ヘッダー
    console.log('[' + arguments.callee.name + '] ' + 'Created a new sheet.');

    rootFolder = DriveApp.getFolderById(SHARED_DRIVE_ID)
    rootFolderPath = '/';
  } else {
    rootFolder = DriveApp.getFolderById(restartFolderId);
    rootFolderPath = restartFolderPath[0];
      restartFolderPath[0] = undefined;
  }

  if(scriptProperties.getProperty("continuationToken_file")) handleFilesInFolder('','',driveMembersEmail);
  processFolder(rootFolder, rootFolderPath, driveMembersEmail, sheet);
  writeDataToSheet(sheet);
  sheet.getRange('A1:1').setBackground('#00B88a');
}

function processFolder(folder, folderPath, driveMembersEmail, sheet) {
  console.log('[' + arguments.callee.name + '] ' + 'Start processing folder: ' + folderPath);
  handleFolderData(folder, folderPath, driveMembersEmail);
  handleFilesInFolder(folder, folderPath, driveMembersEmail);
  processSubFolders(folder, folderPath, driveMembersEmail, sheet);
}

function handleFolderData(folder, folderPath, driveMembersEmail) {
  let accessMember = excludeDriveMembersFromContentAccess(folder.getEditors(),folder.getViewers(),driveMembersEmail);
    let [editors,viewers] = [accessMember[0],accessMember[1]];
  let size = Math.round(folder.getSize() / 1000) + "KB";
  
  writeData.push([
    folderPath, folder.getName(), "folder", folder.getUrl(), folder.getId(), editors, viewers, folder.getSharingAccess(), folder.getSharingPermission(), folder.isShareableByEditors(), folder.getDateCreated(), folder.getLastUpdated(), size, folder.getDescription(), folder.getResourceKey()
  ]);
}

function handleFilesInFolder(folder, folderPath, driveMembersEmail) {
  let continuationToken_file = scriptProperties.getProperty("continuationToken_file");
  let files;

  if (continuationToken_file) {
    files = DriveApp.continueFileIterator(continuationToken_file);
    folderPath = scriptProperties.getProperty("restartFolderPath_fileProcess");
    console.log('[' + arguments.callee.name + '] ' + 'Start processing file with continuationToken: ' + folderPath);
  } else {
    files = folder.getFiles();
  }

  while (files.hasNext()) {
    if (checkExecutionTime()) {
      scriptProperties.setProperty("continuationToken_file", files.getContinuationToken());
      scriptProperties.setProperty("restartFolderPath_fileProcess", folderPath);
      return;
    }
    let file = files.next();
    let accessMember = [excludeDriveMembersFromContentAccess(file.getEditors(),file.getViewers(),driveMembersEmail)];
      let [editors,viewers] = [accessMember[0],accessMember[1]];
    let size = Math.round(file.getSize() / 1000) + "KB";
    
    writeData.push([
      folderPath, file.getName(), file.getMimeType(), file.getUrl(), file.getId(), editors, viewers, file.getSharingAccess(), file.getSharingPermission(), file.isShareableByEditors(), file.getDateCreated(), file.getLastUpdated(), size, file.getDescription(), file.getResourceKey()
    ]);
  }
  scriptProperties.deleteProperty('continuationToken_file');
  scriptProperties.deleteProperty('restartFolderPath_fileProcess');
}

function processSubFolders(folder, folderPath, driveMembersEmail, sheet) {
  console.log('[' + arguments.callee.name + '] ' + 'Start processing: ' + folderPath);
  
  let subFolders;
  let folderIteratorIndex = arrayIndex(continuationToken_folder);
  if (folderIteratorIndex >= 0) {
    subFolders = DriveApp.continueFolderIterator(continuationToken_folder[folderIteratorIndex]);
      continuationToken_folder[folderIteratorIndex] = undefined;
  } else {
    subFolders = folder.getFolders();
  }

  while (subFolders.hasNext()) {
    let subFolder = subFolders.next();
    let restartFolderIndex = arrayIndex(restartFolderPath);
    let restartProcessFlag;

    if (restartFolderIndex >= 0) {
      folderPath = restartFolderPath[restartFolderIndex];
      restartFolderPath[restartFolderIndex] = undefined;
      restartProcessFlag = true;
    } else {
      restartProcessFlag = false;
    }

    let subFolderPath = folderPath + (folderPath === '/' ? '' : '/') + subFolder.getName();

    if (checkExecutionTime()) {
      console.log('[' + arguments.callee.name + '] ' + 'Process after restart: ' + subFolderPath);
      
      if(!scriptProperties.getProperty("restartFolderId")) {
        scriptProperties.setProperty("restartFolderId",subFolder.getId());
        console.log('[' + arguments.callee.name + '] ' + 'Set script property "restartFolderId": ' + subFolderPath);
      }
      
      restartFolderPath_next.push(subFolderPath)
        scriptProperties.setProperty("restartFolderPath",JSON.stringify(restartFolderPath_next));
      continuationToken_folder_next.push(subFolders.getContinuationToken())
        scriptProperties.setProperty("continuationToken_folder",JSON.stringify(continuationToken_folder_next));
      setTrigger('listContents');
      return;
    } else {
      console.log('[' + arguments.callee.name + '] ' + 'Next Process: ' + subFolderPath);
      processFolder(subFolder, subFolderPath, driveMembersEmail, sheet);
    }

    if(restartProcessFlag) processSubFolders(folder, folderPath, driveMembersEmail, sheet);
  }

  console.log('[' + arguments.callee.name + '] ' + 'Reached the bottom of ' + folderPath);
  return;
}

function writeDataToSheet(sheet) {
  if (writeData.length !== 0) {
    const lastRow = sheet.getLastRow();
    const range = sheet.getRange(lastRow + 1, 1, writeData.length, writeData[0].length);
    range.setValues(writeData);
    console.info('[' + arguments.callee.name + '] ' + 'Wrote data to sheet: writeData');
  } else {
    console.info('[' + arguments.callee.name + '] ' + 'Skipped writing data because writeData is null.');
  }

  writeData = new Array;
  return;
}

function excludeDriveMembersFromContentAccess(editors, viewers, driveMembersEmail) {
  // map(user => user.getEmail()): 各ユーザーオブジェクトからメールアドレスだけを抽出して新しい配列を作成
  //[...new Set([...folderEditors, ...sharedDriveMembers])] は、重複を除くために Set を使用し、新しい配列を作成しています。
  //...は配列を展開する役目。
  let editorsEmail = editors.map(user => user.getEmail());
  let viewersEmail = viewers.map(user => user.getEmail());
  let accessMember = [];

  if (editors) {
    accessMember.push([...editorsEmail.filter(function(value) {
      return driveMembersEmail.indexOf(value) === -1;
    })].join(', '));  
  } else {
    accessMember.push('-');
  }

  if (viewers) {
    accessMember.push([...viewersEmail.filter(function(value) {
      return driveMembersEmail.indexOf(value) === -1;
    })].join(', '));  
  } else {
    accessMember.push('-');
  }

  return accessMember;
}

function test() {
  const array = [undefined, undefined];
  if (array){
    console.log('success');
  }
  console.log(arrayIndex(array));
}
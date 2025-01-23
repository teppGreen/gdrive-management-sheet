// //'listContents'を実行
// //シートのデータをリセットして検索をやり直す場合は'resetProcessProperties'を実行
// //参考記事: https://blog.cloudnative.co.jp/19298/

// let writeData = new Array();

// function listContents() {
//   const sheet = ss.getSheetByName("contents"); //シートをグローバルスコープで定義したIDとシート名で取得
//   sheet.getRange('A1:1').setBackground('#f61067');
  
//   deleteTrigger('listContents'); //前回のトリガーを削除
//   const processStatus = scriptProperties.getProperty('process_status');
//     console.log('[' + arguments.callee.name + '] ' + 'processStatus: ' + processStatus);

//   const driveMembersEmail = getDriveMembers().slice(1).map(row => row[1]);
  
//   if (processStatus == 'false') { //なぜかstringで返ってくる
//     sheet.clearContents(); //シートの情報をクリア（元々入力されていた情報が消える）
//     sheet.appendRow([
//       'path', 'name', 'type', 'url', 'id', 'editor', 'viewer', 'genAccess', 'genPermission', 'isShareableByEditors', 'createdDate', 'modifiedDate', 'size', 'discription', 'resourceKey'
//     ]); //ヘッダー
//     console.log('[' + arguments.callee.name + '] ' + 'Created a new sheet.');
//   }

//   processFolder(DriveApp.getFolderById(SHARED_DRIVE_ID), '/', driveMembersEmail, sheet);
//   sheet.getRange('A1:1').setBackground('#00B88a');
// }

// function processFolder(folder, folderPath, driveMembersEmail, sheet) {
//   console.log('[processFolder] Start processing: ' + folderPath);
//   handleFolderData(folder, folderPath, driveMembersEmail, sheet);
//   handleFilesInFolder(folder, folderPath, driveMembersEmail, sheet);
//   processSubFolders(folder, folderPath, driveMembersEmail, sheet);
// }

// function handleFolderData(folder, folderPath, driveMembersEmail, sheet) {
//   if (!doesExistsValueInSheet(folder.getId(),sheet,"E:E")){
//     let accessMember = [excludeDriveMembersFromContentAccess(folder.getEditors(),folder.getViewers(),driveMembersEmail)];
//       let [editors,viewers] = [accessMember[0],accessMember[1]];
//     let size = Math.round(folder.getSize() / 1000) + "KB";
    
//     writeData.push([
//       folderPath, folder.getName(), "folder", folder.getUrl(), folder.getId(), editors, viewers, folder.getSharingAccess(), folder.getSharingPermission(), folder.isShareableByEditors(), folder.getDateCreated(), folder.getLastUpdated(), size, folder.getDescription(), folder.getResourceKey()
//     ]);
//   }
// }

// function handleFilesInFolder(folder, folderPath, driveMembersEmail, sheet) {
//   let continuationToken = scriptProperties.getProperty("continuationToken_file");
//   let files;

//   if (continuationToken) {
//     files = DriveApp.continueFileIterator(continuationToken);
//     folderPath = scriptProperties.getProperty("last_processed_folder_path");
//   } else {
//     files = folder.getFiles();
//   }

//   while (files.hasNext()) {
//     let file;
//     if (checkExecutionTime()) {
//       scriptProperties.setProperty("continuationToken_file", files.getContinuationToken());
//       scriptProperties.setProperty("last_processed_folder_path", folderPath);
//       return;
//     } else {
//       file = files.next();
//     }

//     if (doesExistsValueInSheet(file.getId, sheet, 'E:E')) {
//       let accessMember = [excludeDriveMembersFromContentAccess(file.getEditors(),file.getViewers(),driveMembersEmail)];
//         let [editors,viewers] = [accessMember[0],accessMember[1]];
//       let size = Math.round(file.getSize() / 1000) + "KB";
//       writeData.push([
//         folderPath, file.getName(), file.getMimeType(), file.getUrl(), file.getId(), editors, viewers, file.getSharingAccess(), file.getSharingPermission(), file.isShareableByEditors(), file.getDateCreated(), file.getLastUpdated(), size, file.getDescription(), file.getResourceKey()
//       ]);
//     }
//   }

//   scriptProperties.deleteProperty('continuationToken_file');
//   scriptProperties.deleteProperty('last_processed_folder_path');
// }

// function processSubFolders(folder, folderPath, driveMembersEmail, sheet) {
//   console.log('[' + arguments.callee.name + '] ' + 'Start processing: ' + folderPath);
//   const subFolders = folder.getFolders();

//   if (subFolders) {
//     let subFolderCandidate = new Array();
//     while (subFolders.hasNext()) subFolderCandidate.push(subFolders.next().getId());
//     const falseIndex = doesExistsValueInSheet(subFolderCandidate, sheet, 'E:E').indexOf(false);
//     const trueIndex = falseIndex <= 0 ? 0 : falseIndex - 1;

//     for (let i = trueIndex; i < subFolderCandidate.length; i++) {
//       console.log('[' + arguments.callee.name + '] ' + 'Process folder ' + (i+1) + '/' + (subFolderCandidate.length+1));
      
//       let subFolder = DriveApp.getFolderById(subFolderCandidate[i]);
//       let subFolderPath = folderPath + (folderPath === '/' ? '' : '/') + subFolder.getName();
      
//       if (checkExecutionTime()) {
//         scriptProperties.setProperty('process_status', true);
//         console.log('[' + arguments.callee.name + '] ' + 'Process after restart: ' + subFolderPath);
//         setTrigger('listContents');
//         return;
//       } else {
//         console.log('[' + arguments.callee.name + '] ' + 'Next Process: ' + subFolderPath);
//         processFolder(subFolder, subFolderPath, driveMembersEmail, sheet);
//       }
//     }
//   }

//   console.log('[' + arguments.callee.name + '] ' + 'Reached the bottom of ' + folderPath);
//   scriptProperties.setProperty('process_status', false);
//   writeDataToSheet(sheet);
//   return;
// }

// function writeDataToSheet(sheet) {
//   if (writeData.length !== 0) {
//     const lastRow = sheet.getLastRow();
//     const range = sheet.getRange(lastRow + 1, 1, writeData.length, writeData[0].length);
//     range.setValues(writeData);
//     console.info('[' + arguments.callee.name + '] ' + 'Wrote data to sheet: writeData');
//   } else {
//     console.info('[' + arguments.callee.name + '] ' + 'Skipped writing data because writeData is null.');
//   }

//   writeData = new Array;
//   return;
// }

// function excludeDriveMembersFromContentAccess(editors, viewers, driveMembersEmail) {
//   // map(user => user.getEmail()): 各ユーザーオブジェクトからメールアドレスだけを抽出して新しい配列を作成
//   //[...new Set([...folderEditors, ...sharedDriveMembers])] は、重複を除くために Set を使用し、新しい配列を作成しています。
//   //...は配列を展開する役目。
//   let editorsEmail = editors.map(user => user.getEmail());
//   let viewersEmail = viewers.map(user => user.getEmail());
//   let accessMember = [];

//   if (editors) {
//     accessMember.push([...editorsEmail.filter(function(value) {
//       return driveMembersEmail.indexOf(value) === -1;
//     })].join(', '));  
//   } else {
//     accessMember.push('-');
//   }

//   if (viewers) {
//     accessMember.push([...viewersEmail.filter(function(value) {
//       return driveMembersEmail.indexOf(value) === -1;
//     })].join(', '));  
//   } else {
//     accessMember.push('-');
//   }

//   return accessMember;
// }
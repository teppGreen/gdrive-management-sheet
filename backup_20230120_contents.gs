// // lastModified: 2024-01-21 22:44:00
// // 'listContents'を実行
// // シートのデータをリセットして検索をやり直す場合は'resetProcessProperties'を実行
// // 参考記事: https://blog.cloudnative.co.jp/19298/

// let writeData = new Array();

// function listContents() {
//   const sheet = ss.getSheetByName("contents"); //シートをグローバルスコープで定義したIDとシート名で取得
//   sheet.getRange('A1:1').setBackground('#f61067');
  
//   deleteTrigger('listContents'); //前回のトリガーを削除
//   const processStatus = scriptProperties.getProperty('process_status');
//     console.log('[listContents] processStatus: ' + processStatus);

//   const driveMembersEmail = getDriveMembers().slice(1).map(row => row[1]);
  
//   if (processStatus == 'false') {
//     sheet.clearContents(); //シートの情報をクリア（元々入力されていた情報が消える）
//     sheet.appendRow([
//       'path', 'name', 'type', 'url', 'id', 'editor', 'viewer', 'genAccess', 'genPermission', 'isShareableByEditors', 'createdDate', 'modifiedDate', 'size', 'discription', 'resourceKey'
//     ]); //ヘッダー
//     console.log('[listContents] Created a new sheet.');
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
//   if (!doesExistsValueInSheet(folder.getUrl(),sheet,"D:D")){
//     // map(user => user.getEmail()): 各ユーザーオブジェクトからメールアドレスだけを抽出して新しい配列を作成
//     //[...new Set([...folderEditors, ...sharedDriveMembers])] は、重複を除くために Set を使用し、新しい配列を作成しています。
//     ///...は配列を展開する役目。
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
//       scriptProperties.deleteProperty('continuationToken_file');
//     folderPath = scriptProperties.getProperty("last_processed_folder_path");
//       scriptProperties.deleteProperty('last_processed_folder_path');
//   } else if (doesExistsValueInSheet(folder.getUrl(),sheet,"D:D")){
//     return;
//   } else {
//     files = folder.getFiles();
//   }

//   while (files.hasNext()) {
//     if (checkExecutionTime()) {
//       scriptProperties.setProperty("continuationToken_file", files.getContinuationToken());
//       scriptProperties.setProperty("last_processed_folder_path", folderPath);
//       return;
//     } else {
//       var file = files.next();
//     }

//     if (!doesExistsValueInSheet(file.getUrl(), sheet,"D:D")){
//       let accessMember = [excludeDriveMembersFromContentAccess(file.getEditors(),file.getViewers(),driveMembersEmail)];
//         let [editors,viewers] = [accessMember[0],accessMember[1]];
//       let size = Math.round(file.getSize() / 1000) + "KB";
      
//       writeData.push([
//         folderPath, file.getName(), file.getMimeType(), file.getUrl(), file.getId(), editors, viewers, file.getSharingAccess(), file.getSharingPermission(), file.isShareableByEditors(), file.getDateCreated(), file.getLastUpdated(), size, file.getDescription(), file.getResourceKey()
//       ]);
//     }
//   }
// }

// function processSubFolders(folder, folderPath, driveMembersEmail, sheet) {
//   console.log('[' + arguments.callee.name + '] ' + 'Start processing: ' + folderPath);
//   let subFolders = folder.getFolders();
//   let subFolderCandidate = new Array();
//   let count = 0;
//   let reachEnd;

//   while (subFolders.hasNext() || reachEnd) {
//     console.log('[' + arguments.callee.name + '] ' + 'count: ' + count);
//     if(!reachEnd) subFolderCandidate.push(subFolders.next());

//     try{
//       if(reachEnd || !doesExistsValueInSheet(subFolderCandidate[count].getId(),sheet,'E:E')) {
//         let subFolder = subFolderCandidate[count == 0 ? 0 : count-1];
//         let subFolderPath = folderPath + (folderPath === '/' ? '' : '/') + subFolder.getName();
        
//         if (checkExecutionTime()) {
//           writeDataToSheet(sheet);
//           scriptProperties.setProperty('process_status', true);
//           console.error("GASの実行時間が5分を超えたので中断しました。");
//           console.log('再開後処理するフォルダ: ' + subFolderPath);
//           setTrigger('listContents');
//           return;
//         } else {
//           console.log('次に処理するフォルダ: ' + subFolderPath);
//           processFolder(subFolder, subFolderPath, driveMembersEmail, sheet);
//         }
//       }
//     } catch(e) {
//       console.info('このエラーを無視して続行します: ' + e);
//     }

//     if(reachEnd) break;
//     if(!subFolders.hasNext() && !reachEnd) reachEnd = true;
//     count = count + 1;
//   }

//   console.log(folderPath + 'の最下層に到達しました。');
//   writeDataToSheet(sheet);
//   scriptProperties.setProperty('process_status', false);
//   return;
// }

// function writeDataToSheet(sheet) {
//   if (writeData.length !== 0) {
//     const lastRow = sheet.getLastRow();
//     const range = sheet.getRange(lastRow + 1, 1, writeData.length, writeData[0].length);
//     range.setValues(writeData);
//     console.info('スプレッドシートにデータを入力します。');
//   } else {
//     console.log('writeDataが空のため、スプレッドシートへの入力はスキップします。');
//   }

//   writeData = new Array;
//   return;
// }

// function checkExecutionTime() {
//   //実行時間が超過していたらTRUEを返します。
//   return (new Date().getTime() - startTime) > MAX_EXECUTION_TIME;
// }

// function doesExistsValueInSheet(targetValue, sheet, range) { //データが存在したらtrueを返す
//   var dataRange = sheet.getRange(range); // 指定された範囲を取得
//   var data = dataRange.getValues(); // シートのデータを2次元配列として取得
  
//   // 指定された値を検索
//   for (var i = 0; i < data.length; i++) {
//     for (var j = 0; j < data[i].length; j++) {
//       if (data[i][j] === targetValue) {
//         // 一致する値が見つかったらtrueを返す
//         console.log('[serchValueInSheet] 既にデータが存在します: ' + targetValue);
//         return true;
//       }
//     }
//   }
  
//   // 一致する値が見つからなかった場合はfalseを返す
//   console.log('未処理のファイル/フォルダです: ' + targetValue);
//   return false;
// }

// function excludeDriveMembersFromContentAccess(editors, viewers, driveMembersEmail) {
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
// 使い方: https://fioriera.co.jp/blog/gfolder-copytool/

function doGet() {
  let html = HtmlService
    .createHtmlOutputFromFile('copyFolder_html')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  return html;
}
function copyFolderAndContents(sourceFolderId, targetFolderId) {
  var sourceFolder = DriveApp.getFolderById(sourceFolderId);
  var targetFolder = DriveApp.getFolderById(targetFolderId);
  var newFolderName = 'Copy of ' + sourceFolder.getName();
  var copiedFolder = targetFolder.createFolder(newFolderName);
  copyFolderRecursive(sourceFolder, copiedFolder);
}
function copyFolderRecursive(source, target) {
  var folders = source.getFolders();
  var files = source.getFiles();
  while (files.hasNext()) {
    var file = files.next();
    file.makeCopy(file.getName(), target);
  }
  while (folders.hasNext()) {
    var subFolder = folders.next();
    var folderCopy = target.createFolder(subFolder.getName());
    copyFolderRecursive(subFolder, folderCopy);
  }
}
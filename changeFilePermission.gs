function changeFilePermission() {
  try{
    const FILE_ID = '16D7TdJ7mi63AKjkws7l6ZU5yNTwStY1JRD9zvQCWJ1g';
    const FOLDER_ID = '0AP-COdUDnGZQUk9PVA'
    const filePermissions =  Drive.Permissions.list(FILE_ID, {'supportsAllDrives': true}).items;
    const folderPermissions =  Drive.Permissions.list(FOLDER_ID, {'supportsAllDrives': true}).items;

    for (let filePermission of filePermissions) {
      let i = 0;
      for (let folderPermission of folderPermissions) {
        if (folderPermission.emailAddress === folderPermission.emailAddress) {
          i++
          break;
        }
      }
      if (i === 0) {
        Drive.Permissions.remove(FILE_ID, filePermission.id, {'supportsAllDrives': true})
      }
    }
    
    // // メールアドレスごとにコンテンツマネージャーとして権限を付与
    // for (let email of emails) {
    //   const newPermission = {
    //     'role': 'fileOrganizer',
    //     'type': 'user',
    //     'value': email
    //   };
    //   Drive.Permissions.insert(newPermission, FILE_ID, {
    //     'sendNotificationEmails': false,
    //     'supportsAllDrives': true});
    //   }
  } catch(error) {
    ss.toast(error.message,'エラーが発生しました');
  }
}
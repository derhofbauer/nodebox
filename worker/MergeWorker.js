'use strict'

module.exports = class MergeWorker {
  constructor (ServerFileListWorker, LocalFileListWorker) {
    this.serverFileListWorker = ServerFileListWorker
    this.localFileListWorker = LocalFileListWorker

    this.downloadList = []
  }

  watchWorkersForChanges () {

  }

  mergeFileLists () {

  }
}

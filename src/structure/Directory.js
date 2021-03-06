// Dependencies:
import Promise from 'bluebird';
import fs from 'graceful-fs';
import path from 'path';
import { File } from './File';

// Errors:
import { TractorError } from 'tractor-error-handler';

export class Directory {
    constructor (directoryPath, fileStructure) {
        this.path = path.resolve(process.cwd(), directoryPath);
        this.fileStructure = fileStructure;

        let isRoot = this.path === fileStructure.path;
        let isWithinRoot = this.path.indexOf(`${fileStructure.path}${path.sep}`) === 0;

        if (!isRoot && !isWithinRoot)  {
            throw new TractorError(`Cannot create "${this.path}" because it is outside of the root of the FileStructure`);
        }

        this.init();

        let relativePath = path.relative(this.fileStructure.path, this.path);
        this.name = path.basename(this.path);
        this.basename = this.name;
        this.url = path.normalize(`/${relativePath}`).replace(/\\/, '/');

        if (isRoot) {
            this.parent = this.fileStructure;
        } else {
            let parentPath = path.dirname(this.path);
            let parent = fileStructure.allDirectoriesByPath[parentPath];
            if (parent) {
                this.directory = parent;
            } else {
                this.directory = new Directory(parentPath, fileStructure);
            }
            this.parent = this.directory;
        }
        this.parent.addItem(this);
    }

    addItem (item) {
        let itemIsDirectory = item instanceof Directory;
        let collection = itemIsDirectory ? this.directories : this.files;
        let allCollection = itemIsDirectory ? this.allDirectories : this.allFiles;

        if (item.directory === this && collection.indexOf(item) === -1) {
            collection.push(item);
        }
        if (allCollection.indexOf(item) === -1) {
            allCollection.push(item);
        }

        this.parent.addItem(item);
    }

    cleanup () {
        return this.delete()
        .then(() => {
            if (this.directory) {
                return this.directory.cleanup();
            }
            return Promise.resolve();
        })
        .catch(e => {
            if (e instanceof TractorError) {
                return;
            }
            throw e;
        });
    }

    delete () {
        if (!this.directories.length && !this.files.length) {
            return fs.rmdirAsync(this.path)
            .then(() => {
                this.parent.removeItem(this);
            });
        } else {
            return Promise.reject(new TractorError(`Cannot delete "${this.path}" because it is not empty`));
        }
    }

    init () {
        this.directories = [];
        this.allDirectories = [];
        this.files = [];
        this.allFiles = [];
    }

    move (update, options = { }) {
        let { isCopy } = options;
        update.oldPath = this.path;

        let newDirectory = new this.constructor(update.newPath, this.fileStructure);
        return newDirectory.save()
        .then(() => {
            let items = this.directories.concat(this.files);
            return Promise.map(items, item => {
                let newPath = item.path.replace(update.oldPath, update.newPath);
                return item.move({ newPath }, options);
            });
        })
        .then(() => isCopy ? null : this.delete())
        .then(() => newDirectory);
    }

    read () {
        if (this.reading) {
            return this.reading;
        }
        this.reading = fs.readdirAsync(this.path)
        .then(itemPaths => readItems.call(this, itemPaths));
        this.reading.then(() => {
            this.reading = null;
        });
        return this.reading;
    }

    refresh () {
        if (this.refreshing) {
            return this.refreshing;
        }
        this.init();
        this.refreshing = this.read();
        this.refreshing.then(() => {
            this.refreshing = null;
        });
        return this.refreshing;
    }

    removeItem (item) {
        let itemIsDirectory = item instanceof Directory;
        let collection = itemIsDirectory ? this.directories : this.files;
        let allCollection = itemIsDirectory ? this.allDirectories : this.allFiles;

        let removeIndex = allCollection.indexOf(item);
        allCollection.splice(removeIndex, 1);
        if (item.directory === this) {
            let removeIndex = collection.indexOf(item);
            collection.splice(removeIndex, 1);
        }

        this.parent.removeItem(item);
    }

    rimraf () {
        return Promise.map(this.directories, directory => directory.rimraf())
        .then(() => Promise.map(this.files, file => file.delete()))
        .then(() => fs.rmdirAsync(this.path))
        .then(() => {
            this.parent.removeItem(this);
        });
    }

    save () {
        return fs.statAsync(this.path)
        .then(() => Promise.resolve())
        .catch(() => {
            if (this.directory) {
                return this.directory.save()
                .then(() => fs.mkdirAsync(this.path));
            }
            return Promise.resolve();
        });
    }

    serialise () {
        return this.toJSON();
    }

    toJSON () {
        let { basename, directories, files, path, url } = this;
        directories = directories.sort(sortNames).map(directory => directory.serialise());
        files = files.sort(sortNames).map(file => file.serialise());
        return { basename, directories, files, isDirectory: true, path, url };
    }
}

function getItemInfo (itemPath) {
    return fs.statAsync(itemPath)
    .then(stat => handleItem.call(this, itemPath, stat));
}

function handleItem (itemPath, stat) {
    if (stat.isDirectory()) {
        let directory = new this.constructor(itemPath, this.fileStructure);
        return directory.read();
    } else {
        let fileConstructor = this.fileStructure.getFileConstructor(itemPath);
        let file = new fileConstructor(itemPath, this.fileStructure);
        if (fileConstructor === File) {
            return file;
        } else {
            return file.read();
        }
    }
}

function readItems (itemPaths) {
    return Promise.map(itemPaths, itemPath => {
        return getItemInfo.call(this, path.join(this.path, itemPath));
    });
}

function sortNames (a, b) {
    let aName = a.name;
    let bName = b.name;
    if (aName === bName) {
        return 0;
    } else if (aName > bName) {
        return 1;
    } else {
        return -1;
    }
}

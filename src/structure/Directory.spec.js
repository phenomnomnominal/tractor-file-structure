/* global describe:true, it:true */

// Test setup:
import { expect, sinon } from '../../test-setup';

// Dependencies:
import fs from 'graceful-fs';
import path from 'path';
import { File } from './File';
import { FileStructure } from './FileStructure';

// Errors:
import { TractorError } from 'tractor-error-handler';

// Under test:
import { Directory } from './Directory';

describe('tractor-file-structure - Directory:', () => {
    describe('Directory constructor:', () => {
        it('should create a new Directory', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));

            let directory = new Directory(path.join(path.sep, 'file-structure', 'directory'), fileStructure);

            expect(directory).to.be.an.instanceof(Directory);
        });

        it('should work out the directory name', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));

            let directory = new Directory(path.join(path.sep, 'file-structure', 'directory'), fileStructure);

            expect(directory.name).to.equal('directory');
        });

        it('should work out the directory basename', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));

            let directory = new Directory(path.join(path.sep, 'file-structure', 'directory'), fileStructure);

            expect(directory.basename).to.equal('directory');
        });

        it('should work out the URL to the directory from the fileStructure', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));

            let directory = new Directory(path.join(path.sep, 'file-structure', 'directory'), fileStructure);

            expect(directory.url).to.equal('/directory');
            expect(fileStructure.structure.url).to.equal('/');
        });

        it('should work out the parent directory', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));
            let directory = new Directory(path.join(path.sep, 'file-structure', 'directory'), fileStructure);

            let subdirectory = new Directory(path.join(path.sep, 'file-structure', 'directory', 'sub-directory'), fileStructure);

            expect(subdirectory.directory).to.equal(directory);
        });

        it(`should create the parent directory if it doesn't exist`, () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));

            let subdirectory = new Directory(path.join(path.sep, 'file-structure', 'parent-directory', 'directory', 'sub-directory'), fileStructure);

            expect(subdirectory.directory).to.not.be.undefined();
            expect(fileStructure.allDirectoriesByPath[path.join(path.sep, 'file-structure', 'parent-directory')]).to.not.be.undefined();
            expect(fileStructure.allDirectoriesByPath[path.join(path.sep, 'file-structure', 'parent-directory', 'directory')]).to.not.be.undefined();
        });

        it('should throw an error if the Directory path is outside the root of the FileStructure', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));

            expect(() => {
                new Directory(path.join(path.sep, 'outside'), fileStructure);
            }).to.throw(TractorError, `Cannot create "${path.join(path.sep, 'outside')}" because it is outside of the root of the FileStructure`);
        });
    });

    describe('Directory.addItem:', () => {
        it('should add a file to the directory', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));
            let directory = new Directory(path.join(path.sep, 'file-structure', 'directory'), fileStructure);
            let file = new File(path.join(path.sep, 'file-structure', 'directory', 'file.ext'), fileStructure);

            directory.addItem(file);

            expect(directory.files.length).to.equal(1);
            let [expectedFile] = directory.files;
            expect(expectedFile).to.equal(file);
        });

        it('should not add the file if it has already been added', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));
            let directory = new Directory(path.join(path.sep, 'file-structure', 'directory'), fileStructure);
            let file = new File(path.join(path.sep, 'file-structure', 'directory', 'file.ext'), fileStructure);

            directory.addItem(file);
            directory.addItem(file);

            expect(directory.files.length).to.equal(1);
        });

        it('should add the file to the fileStructure', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));

            sinon.stub(fileStructure, 'addItem');

            let directory = new Directory(path.join(path.sep, 'file-structure', 'directory'), fileStructure);
            let file = new File(path.join(path.sep, 'file-structure', 'directory', 'file.ext'), fileStructure);
            directory.addItem(file);

            expect(fileStructure.addItem).to.have.been.calledWith(file);
        });

        it('should add a directory to the directory', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));
            let directory = new Directory(path.join(path.sep, 'file-structure', 'directory'), fileStructure);
            let subdirectory = new Directory(path.join(path.sep, 'file-structure', 'directory', 'sub-directory'), fileStructure);

            directory.addItem(subdirectory);

            expect(directory.directories.length).to.equal(1);
            let [expectedDirectory] = directory.directories;
            expect(expectedDirectory).to.equal(subdirectory);
        });

        it('should not add the directory if it has already been added', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));
            let directory = new Directory(path.join(path.sep, 'file-structure', 'directory'), fileStructure);
            let subdirectory = new Directory(path.join(path.sep, 'file-structure', 'directory', 'sub-directory'), fileStructure);

            directory.addItem(subdirectory);
            directory.addItem(subdirectory);

            expect(directory.directories.length).to.equal(1);
        });

        it('should add the directory to the fileStructure', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));

            sinon.stub(fileStructure, 'addItem');

            let directory = new Directory(path.join(path.sep, 'file-structure', 'directory'), fileStructure);
            let subdirectory = new Directory(path.join(path.sep, 'file-structure', 'directory', 'sub-directory'), fileStructure);

            directory.addItem(subdirectory);

            expect(fileStructure.addItem).to.have.been.calledWith(subdirectory);
        });
    });

    describe('Directory.cleanup:', () => {
        it('should delete the directory', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));
            let directory = new Directory(path.join(path.sep, 'file-structure', 'directory'), fileStructure);

            sinon.stub(directory, 'delete').resolves();
            sinon.stub(directory.directory, 'cleanup').resolves();

            return directory.cleanup()
            .then(() => {
                expect(directory.delete).to.have.been.called();
            });
        });

        it('should cleanup the parent directory', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));
            let directory = new Directory(path.join(path.sep, 'file-structure', 'directory'), fileStructure);

            sinon.stub(directory, 'delete').resolves();
            sinon.stub(directory.directory, 'cleanup').resolves();

            return directory.cleanup()
            .then(() => {
                expect(directory.directory.cleanup).to.have.been.called();
            });
        });

        it('should stop once it gets to the root of the FileStructure', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));
            let directory = new Directory(path.join(path.sep, 'file-structure', 'directory'), fileStructure);

            sinon.stub(fs, 'rmdirAsync').resolves();
            sinon.spy(directory, 'delete');
            sinon.spy(directory.directory, 'delete');

            return directory.cleanup()
            .then(() => {
                expect(directory.delete).to.have.been.called();
                expect(directory.directory.delete).to.have.been.called();
            })
            .finally(() => {
                fs.rmdirAsync.restore();
            });
        });

        it('should stop once it gets to a directory that is not empty', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));
            let directory = new Directory(path.join(path.sep, 'file-structure', 'directory'), fileStructure);
            let file = new File(path.join(path.sep, 'file-structure', 'directory', 'file.ext'), fileStructure);
            let subdirectory = new Directory(path.join(path.sep, 'file-structure', 'directory', 'sub-directory'), fileStructure);

            sinon.stub(fs, 'rmdirAsync').resolves();
            sinon.spy(directory, 'delete');
            sinon.spy(file, 'delete');
            sinon.spy(subdirectory, 'delete');

            return subdirectory.cleanup()
            .then(() => {
                expect(fs.rmdirAsync).to.have.been.calledOnce();
                expect(subdirectory.delete).to.have.been.called();
                expect(directory.delete).to.have.been.called();
                expect(file.delete).to.not.have.been.called();
            })
            .finally(() => {
                fs.rmdirAsync.restore();
            })
        });

        it('should rethrow if something unexpected goes wrong', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));
            let directory = new Directory(path.join(path.sep, 'file-structure', 'directory'), fileStructure);

            let error = new Error('Unexpected error')
            sinon.stub(fs, 'rmdirAsync').rejects(error);

            return directory.cleanup()
            .catch(e => {
                expect(e).to.equal(error);
            })
            .finally(() => {
                fs.rmdirAsync.restore();
            });
        });
    });

    describe('Directory.delete:', () => {
        it('should delete the directory if it is empty', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));
            let directory = new Directory(path.join(path.sep, 'file-structure', 'directory'), fileStructure);

            sinon.stub(fs, 'rmdirAsync').resolves();

            return directory.delete()
            .then(() => {
                expect(fs.rmdirAsync).to.have.been.calledWith(path.join(path.sep, 'file-structure', 'directory'));
            })
            .finally(() => {
                fs.rmdirAsync.restore();
            });
        });

        it('should remove itself from its parent directory', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));
            let directory = new Directory(path.join(path.sep, 'file-structure', 'directory'), fileStructure);

            sinon.stub(fs, 'rmdirAsync').resolves();
            sinon.stub(fileStructure.structure, 'removeItem');

            return directory.delete()
            .then(() => {
                expect(fileStructure.structure.removeItem).to.have.been.calledWith(directory);
            })
            .finally(() => {
                fs.rmdirAsync.restore();
            });
        });

        it('should remove itself from the FileStructure if it is the root directory', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));

            sinon.stub(fs, 'rmdirAsync').resolves();
            sinon.stub(fileStructure, 'removeItem');

            return fileStructure.structure.delete()
            .then(() => {
                expect(fileStructure.removeItem).to.have.been.calledWith(fileStructure.structure);
            })
            .finally(() => {
                fs.rmdirAsync.restore();
            });
        });

        it('should throw if the directory is not empty', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));
            let directory = new Directory(path.join(path.sep, 'file-structure', 'directory'), fileStructure);
            let file = new File(path.join(path.sep, 'file-structure', 'directory', 'file.ext'), fileStructure);
            let subdirectory = new Directory(path.join(path.sep, 'file-structure', 'directory', 'sub-directory'), fileStructure);

            sinon.stub(fs, 'rmdirAsync').resolves();
            sinon.spy(file, 'delete');
            sinon.spy(subdirectory, 'delete');

            return directory.delete()
            .catch(e => {
                expect(e).to.deep.equal(new TractorError(`Cannot delete "${directory.path}" because it is not empty`));
                expect(subdirectory.delete).to.not.have.been.called();
                expect(file.delete).to.not.have.been.called();
            })
            .finally(() => {
                fs.rmdirAsync.restore();
            });
        })
    });

    describe('Directory.move:', () => {
        it('should move a directory', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));

            sinon.spy(Directory.prototype, 'constructor');
            sinon.stub(Directory.prototype, 'delete').resolves();
            sinon.stub(Directory.prototype, 'save').resolves();

            let directory = new Directory(path.join(path.sep, 'file-structure', 'directory'), fileStructure);

            return directory.move({
                newPath: path.join(path.sep, 'file-structure', 'other-directory')
            })
            .then(() => {
                expect(Directory.prototype.constructor).to.have.been.calledWith(path.join(path.sep, 'file-structure', 'other-directory'), fileStructure);
                expect(Directory.prototype.save).to.have.been.called();
                expect(Directory.prototype.delete).to.have.been.called();
            })
            .finally(() => {
                Directory.prototype.constructor.restore();
                Directory.prototype.delete.restore();
                Directory.prototype.save.restore();
            });
        });

        it('should copy a directory', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));

            sinon.spy(Directory.prototype, 'constructor');
            sinon.stub(Directory.prototype, 'delete').resolves();
            sinon.stub(Directory.prototype, 'save').resolves();

            let directory = new Directory(path.join(path.sep, 'file-structure', 'directory'), fileStructure);

            return directory.move({
                newPath: path.join(path.sep, 'file-structure', 'other-directory')
            }, {
                isCopy: true
            })
            .then(() => {
                expect(Directory.prototype.constructor).to.have.been.calledWith(path.join(path.sep, 'file-structure', 'other-directory'), fileStructure);
                expect(Directory.prototype.save).to.have.been.called();
                expect(Directory.prototype.delete).to.not.have.been.called();
            })
            .finally(() => {
                Directory.prototype.constructor.restore();
                Directory.prototype.delete.restore();
                Directory.prototype.save.restore();
            });
        });

        it('should move all the children items', () => {
          let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));

          sinon.stub(Directory.prototype, 'delete').resolves();
          sinon.stub(Directory.prototype, 'save').resolves();

          let directory = new Directory(path.join(path.sep, 'file-structure', 'directory'), fileStructure);
          let subDirectory1 = new Directory(path.join(path.sep, 'file-structure', 'directory', 'sub-directory-1'), fileStructure);
          let subDirectory2 = new Directory(path.join(path.sep, 'file-structure', 'directory', 'sub-directory-2'), fileStructure);

          sinon.stub(subDirectory1, 'move').resolves();
          sinon.stub(subDirectory2, 'move').resolves();

          return directory.move({
              newPath: path.join(path.sep, 'file-structure', 'other-directory')
          })
          .then(() => {
              expect(subDirectory1.move).to.have.been.calledWith({ newPath: path.join(path.sep, 'file-structure', 'other-directory', 'sub-directory-1') });
              expect(subDirectory2.move).to.have.been.calledWith({ newPath: path.join(path.sep, 'file-structure', 'other-directory', 'sub-directory-2') });
          })
          .finally(() => {
              Directory.prototype.delete.restore();
              Directory.prototype.save.restore();
          });
        });
    });

    describe('Directory.read:', () => {
        it('should read the directory', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));

            sinon.stub(fs, 'readdirAsync').resolves([]);

            let directory = new Directory(path.join(path.sep, 'file-structure', 'parent-directory', 'directory'), fileStructure);

            return directory.read()
            .then(() => {
                expect(fs.readdirAsync).to.have.been.called.with(path.join(path.sep, 'file-structure', 'parent-directory', 'directory'));
            })
            .finally(() => {
                fs.readdirAsync.restore();
            });
        });

        it('should should not read the directory while it is already being read', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));

            sinon.stub(fs, 'readdirAsync').resolves([]);

            let directory = new Directory(path.join(path.sep, 'file-structure', 'parent-directory', 'directory'), fileStructure);

            directory.read()
            return directory.read()
            .then(() => {
                expect(fs.readdirAsync).to.have.been.calledOnce();
            })
            .finally(() => {
                fs.readdirAsync.restore();
            });
        });

        it('should read any directories contained within the Directory', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));
            let stat = {
                isDirectory: () => { }
            };

            sinon.spy(Directory.prototype, 'read');
            let readdirAsync = sinon.stub(fs, 'readdirAsync');
            readdirAsync.onCall(0).resolves(['directory']);
            readdirAsync.onCall(1).resolves([]);
            sinon.stub(fs, 'statAsync').resolves(stat);
            sinon.stub(stat, 'isDirectory').returns(true);

            let directory = new Directory(path.join(path.sep, 'file-structure', 'parent-directory', 'directory'), fileStructure);

            return directory.read()
            .then(() => {
                expect(fs.statAsync).to.have.been.called.with(path.join(path.sep, 'file-structure', 'parent-directory', 'directory'));
                expect(Directory.prototype.read).to.have.been.calledTwice();
            })
            .finally(() => {
                Directory.prototype.read.restore();
                fs.readdirAsync.restore();
                fs.statAsync.restore();
            });
        });

        it('should create a model for any files contained within the Directory', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));
            let stat = {
                isDirectory: () => { }
            };

            sinon.stub(fs, 'readdirAsync').resolves(['file.ext']);
            sinon.stub(fs, 'statAsync').resolves(stat);
            sinon.stub(stat, 'isDirectory').returns(false);

            let directory = new Directory(path.join(path.sep, 'file-structure', 'parent-directory', 'directory'), fileStructure);

            return directory.read()
            .then(() => {
                expect(fs.statAsync).to.have.been.called.with(path.join(path.sep, 'file-structure', 'parent-directory', 'directory', 'file.ext'));
                expect(directory.files.length).to.equal(1);
            })
            .finally(() => {
                fs.readdirAsync.restore();
                fs.statAsync.restore();
            });
        });

        it('should create a rich model for files of a known type', () => {
            class TestFile extends File { }
            TestFile.prototype.extension = '.ext';

            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));
            fileStructure.addFileType(TestFile);
            let directory = new Directory(path.join(path.sep, 'file-structure', 'parent-directory', 'directory'), fileStructure);
            let stat = {
                isDirectory: () => { }
            };

            sinon.stub(File.prototype, 'read');
            sinon.stub(fs, 'readdirAsync').resolves(['file.ext']);
            sinon.stub(fs, 'statAsync').resolves(stat);
            sinon.stub(stat, 'isDirectory').returns(false);

            return directory.read()
            .then(() => {
                expect(fs.statAsync).to.have.been.called.with(path.join(path.sep, 'file-structure', 'parent-directory', 'directory', 'file.ext'));
                let [file] = directory.files;
                expect(file instanceof TestFile).to.equal(true);
            })
            .finally(() => {
                File.prototype.read.restore();
                fs.readdirAsync.restore();
                fs.statAsync.restore();
            });
        });

        it('should create a rich model for files of a known type with multiple extensions', () => {
            class SpecialTestFile extends File { }
            SpecialTestFile.prototype.extension = '.special.ext';

            sinon.stub(SpecialTestFile.prototype, 'save').resolves();

            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));
            fileStructure.addFileType(SpecialTestFile);
            let directory = new Directory(path.join(path.sep, 'file-structure', 'parent-directory', 'directory'), fileStructure);
            let stat = {
                isDirectory: () => { }
            };

            sinon.stub(File.prototype, 'read');
            sinon.stub(fs, 'readdirAsync').resolves(['file.special.ext']);
            sinon.stub(fs, 'statAsync').resolves(stat);
            sinon.stub(stat, 'isDirectory').returns(false);

            return directory.read()
            .then(() => {
                expect(fs.statAsync).to.have.been.called.with(path.join(path.sep, 'file-structure', 'parent-directory', 'directory', 'file.special.ext'));
                let [file] = directory.files;
                expect(file instanceof SpecialTestFile).to.equal(true);
            })
            .finally(() => {
                File.prototype.read.restore();
                fs.readdirAsync.restore();
                fs.statAsync.restore();
            });
        });
    });

    describe('Directory.refresh:', () => {
        it('should refresh the directory', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));
            let directory = new Directory(path.join(path.sep, 'file-structure', 'directory'), fileStructure);

            sinon.stub(Directory.prototype, 'init');
            sinon.stub(Directory.prototype, 'read').resolves();

            return directory.refresh()
            .then(() => {
                expect(Directory.prototype.init).to.have.been.called();
                expect(Directory.prototype.read).to.have.been.called();
            })
            .finally(() => {
                Directory.prototype.init.restore();
                Directory.prototype.read.restore();
            });
        });

        it('should should not refresh while the directory is being read', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));
            let directory = new Directory(path.join(path.sep, 'file-structure', 'directory'), fileStructure);

            sinon.stub(Directory.prototype, 'read').resolves();

            directory.refresh()
            return directory.refresh()
            .then(() => {
                expect(Directory.prototype.read).to.have.been.calledOnce();
            })
            .finally(() => {
                Directory.prototype.read.restore();
            });
        });
    });

    describe('Directory.removeItem:', () => {
        it('should remove a file from the directory', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));

            let directory = new Directory(path.join(path.sep, 'file-structure', 'directory'), fileStructure);
            let file = new File(path.join(path.sep, 'file-structure', 'directory', 'file.ext'), fileStructure);

            directory.removeItem(file);

            expect(directory.files.length).to.equal(0);
        });

        it('should remove the file from the fileStructure', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));

            sinon.stub(fileStructure, 'removeItem');

            let directory = new Directory(path.join(path.sep, 'file-structure', 'directory'), fileStructure);
            let file = new File(path.join(path.sep, 'file-structure', 'directory', 'file.ext'), fileStructure);
            directory.files.push(file);

            directory.removeItem(file);

            expect(fileStructure.removeItem).to.have.been.calledWith(file);
        });

        it('should remove a directory from the directory', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));

            let directory = new Directory(path.join(path.sep, 'file-structure', 'directory'), fileStructure);
            let subdirectory = new Directory(path.join(path.sep, 'file-structure', 'directory', 'sub-directory'), fileStructure);

            directory.removeItem(subdirectory);

            expect(directory.directories.length).to.equal(0);
        });

        it('should remove the directory from the fileStructure', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));

            sinon.stub(fileStructure, 'removeItem');

            let directory = new Directory(path.join(path.sep, 'file-structure', 'directory'), fileStructure);
            let subdirectory = new Directory(path.join(path.sep, 'file-structure', 'directory', 'sub-directory'), fileStructure);

            directory.removeItem(subdirectory);

            expect(fileStructure.removeItem).to.have.been.calledWith(subdirectory);
        });
    });

    describe('Directory.rimraf:', () => {
        it('should delete the directory', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));

            sinon.stub(fs, 'rmdirAsync').resolves();

            let directory = new Directory(path.join(path.sep, 'file-structure', 'parent-directory', 'directory'), fileStructure);

            return directory.rimraf()
            .then(() => {
                expect(fs.rmdirAsync).to.have.been.calledWith(path.join(path.sep, 'file-structure', 'parent-directory', 'directory'));
            })
            .finally(() => {
                fs.rmdirAsync.restore();
            });
        });

        it('should remove itself from its parent', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));
            let parent = new Directory(path.join(path.sep, 'file-structure', 'parent-directory'), fileStructure);

            sinon.stub(fs, 'rmdirAsync').resolves();
            sinon.stub(parent, 'removeItem');

            let directory = new Directory(path.join(path.sep, 'file-structure', 'parent-directory', 'directory'), fileStructure);

            return directory.rimraf()
            .then(() => {
                expect(parent.removeItem).to.have.been.calledWith(directory);
            })
            .finally(() => {
                fs.rmdirAsync.restore();
            });
        });

        it('should remove itself from the FileStructure if it is the root direction', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));

            sinon.stub(fs, 'rmdirAsync').resolves();
            sinon.stub(fileStructure, 'removeItem');

            return fileStructure.structure.rimraf()
            .then(() => {
                expect(fileStructure.removeItem).to.have.been.calledWith(fileStructure.structure);
            })
            .finally(() => {
                fs.rmdirAsync.restore();
            });
        });

        it('should delete all its sub-directories', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));
            let directory = new Directory(path.join(path.sep, 'file-structure', 'parent-directory', 'directory'), fileStructure);
            let subdirectory = new Directory(path.join(path.sep, 'file-structure', 'parent-directory', 'directory', 'sub-directory'), fileStructure);

            sinon.stub(fs, 'rmdirAsync').resolves();
            sinon.stub(subdirectory, 'rimraf');

            return directory.rimraf()
            .then(() => {
                expect(subdirectory.rimraf).to.have.been.called();
            })
            .finally(() => {
                fs.rmdirAsync.restore();
            });
        });

        it('should delete all its files', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));
            let directory = new Directory(path.join(path.sep, 'file-structure', 'parent-directory', 'directory'), fileStructure);
            let file = new File(path.join(path.sep, 'file-structure', 'parent-directory', 'directory', 'file.ext'), fileStructure);

            sinon.stub(fs, 'rmdirAsync').resolves();
            sinon.stub(file, 'delete');

            return directory.rimraf()
            .then(() => {
                expect(file.delete).to.have.been.called();
            })
            .finally(() => {
                fs.rmdirAsync.restore();
            });
        });
    });

    describe('Directory.save:', () => {
        it('should should do nothing if the directory already exists', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));
            let directory = new Directory(path.join(path.sep, 'file-structure', 'parent-directory', 'directory'), fileStructure);

            sinon.stub(fs, 'statAsync').resolves();
            sinon.spy(fs, 'mkdirAsync')

            return directory.save()
            .then(() => {
                expect(fs.statAsync).to.have.been.calledWith(path.join(path.sep, 'file-structure', 'parent-directory', 'directory'));
                expect(fs.mkdirAsync).to.not.have.been.called();
            })
            .finally(() => {
                fs.statAsync.restore();
                fs.mkdirAsync.restore();
            });
        });

        it(`should save the directory if it doesn't exist yet`, () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));
            let directory = new Directory(path.join(path.sep, 'file-structure', 'parent-directory', 'directory'), fileStructure);

            sinon.stub(fs, 'statAsync').rejects();
            sinon.stub(fs, 'mkdirAsync').resolves();

            return directory.save()
            .then(() => {
                expect(fs.mkdirAsync).to.have.been.calledWith(path.join(path.sep, 'file-structure', 'parent-directory', 'directory'));
            })
            .finally(() => {
                fs.mkdirAsync.restore();
            });
        });
    });

    describe('Directory.toJSON:', () => {
        it('should return important properties of the directory', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));
            let directory = new Directory(path.join(path.sep, 'file-structure', 'directory'), fileStructure);
            let subdirectory = new Directory(path.join(path.sep, 'file-structure', 'directory', 'sub-directory'), fileStructure);
            let file = new File(path.join(path.sep, 'file-structure', 'directory', 'file.ext'), fileStructure);

            expect(directory.toJSON()).to.deep.equal({
                basename: 'directory',
                directories: [subdirectory.serialise()],
                files: [file.serialise()],
                isDirectory: true,
                path: path.join(path.sep, 'file-structure', 'directory'),
                url: '/directory'
            });
        });

        it('should order the directories in alphabetic order', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));
            let directory = new Directory(path.join(path.sep, 'file-structure', 'directory'), fileStructure);
            let subdirectory1 = new Directory(path.join(path.sep, 'file-structure', 'directory', 'sub-directory-z'), fileStructure);
            let subdirectory2 = new Directory(path.join(path.sep, 'file-structure', 'directory', 'sub-directory-a'), fileStructure);
            let subdirectory3 = new Directory(path.join(path.sep, 'file-structure', 'directory', 'sub-directory-f'), fileStructure);
            let subdirectory4 = new Directory(path.join(path.sep, 'file-structure', 'directory', 'sub-directory-a'), fileStructure);

            expect(directory.toJSON()).to.deep.equal({
                basename: 'directory',
                directories: [subdirectory2.serialise(), subdirectory4.serialise(), subdirectory3.serialise(), subdirectory1.serialise()],
                files: [],
                isDirectory: true,
                path: path.join(path.sep, 'file-structure', 'directory'),
                url: '/directory'
            });
        });

        it('should order the files in alphabetic order', () => {
            let fileStructure = new FileStructure(path.join(path.sep, 'file-structure'));
            let directory = new Directory(path.join(path.sep, 'file-structure', 'directory'), fileStructure);
            let file1 = new File(path.join(path.sep, 'file-structure', 'directory', 'file-z.ext'), fileStructure);
            let file2 = new File(path.join(path.sep, 'file-structure', 'directory', 'file-a.ext'), fileStructure);
            let file3 = new File(path.join(path.sep, 'file-structure', 'directory', 'file-f.ext'), fileStructure);
            let file4 = new File(path.join(path.sep, 'file-structure', 'directory', 'file-a.ext'), fileStructure);

            expect(directory.toJSON()).to.deep.equal({
                basename: 'directory',
                directories: [],
                files: [file2.serialise(), file4.serialise(), file3.serialise(), file1.serialise()],
                isDirectory: true,
                path: path.join(path.sep, 'file-structure', 'directory'),
                url: '/directory'
            });
        });
    });
});

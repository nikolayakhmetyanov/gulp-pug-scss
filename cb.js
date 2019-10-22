'use strict';

const fs = require('fs');                // будем работать с файловой системой
const mkdirp = require('mkdirp');        // зависимость, должна быть установлена (см. описание выше)
const rmdir = require('rmdir');           // зависимость, должна быть установлена (см. описание выше)

let blockName = process.argv[2];          // получим имя блока
let defaultExtensions = ['pug', 'scss']; // расширения по умолчанию
let extensions = uniqueArray(defaultExtensions.concat(process.argv.slice(3)));  // добавим введенные при вызове расширения (если есть)

// Если есть имя блока
if(blockName) {

  if(process.argv[3] == 'rm'){ // удаление
    removeBlock();
  }
  else{ // создание
    createBlock();
  }

}
else {
  console.log('Отмена операции: не указан блок');
}

// создание блока
function createBlock() {
  let dirPath = 'src/blocks/' + blockName + '/'; // полный путь к создаваемой папке блока
  mkdirp(dirPath, function(err){                 // создаем

    // Если какая-то ошибка — покажем
    if(err) {
      console.error('Отмена операции: ' + err);
    }

    // Нет ошибки, поехали!
    else {

      console.log('Создание папки ' + dirPath + ' (создана, если ещё не существует)');

      // Обходим массив расширений и создаем файлы, если они еще не созданы
      extensions.forEach(function(extention){

        let filePath = dirPath + blockName + '.' + extention; // полный путь к создаваемому файлу
        let fileContent = '';                                 // будущий контент файла
        let styleFileImport = '';                             // будущая конструкция импорта файла стилей
        let templateFileImport = '';                          // будущая конструкция импорта файла шаблонов
        let fileCreateMsg = '';                               // будущее сообщение в консоли при создании файла

        // Если это SCSS
        if(extention == 'scss') {
          styleFileImport = '@import \'./src/blocks/' + blockName + '/' + blockName + '\';';
          fileContent = '.' + blockName + ' {\n  \n}\n';

          fs.appendFile('src/styles/style.scss', '\n' + styleFileImport, function (err) {
            if(err) {
              return console.log('style.scss НЕ обновлён: ' + err);
            }
            console.log('style.scss обновлён');
          });
        }

        // Если это PUG
        if(extention == 'pug') {
          templateFileImport = 'include ../blocks/' + blockName + '/' + blockName + '.pug';
          fileContent = 'mixin ' + blockName + '\n' + '  +b.' + blockName;

          fs.appendFile('src/templates/blocks.pug', '\n' + templateFileImport, function (err) {
            if(err) {
              return console.log('blocks.pug НЕ обновлён: ' + err);
            }
            console.log('blocks.pug обновлён');
          });
        }


        // Создаем файл, если он еще не существует
        if(fileExist(filePath) === false) {

          fs.writeFile(filePath, fileContent, function(err) {
            if(err) {
              return console.log('Файл НЕ создан: ' + err);
            }
            console.log('Файл создан: ' + filePath);
          });
        }
        else {
          console.log('Файл НЕ создан: ' + filePath + ' (уже существует)');
        }

      });
    }
  });
}

// удаление блока
function removeBlock(){
  let blockDelName = 'src/blocks/' + blockName; // имя удаляемого блока
  let includeStrScss = '\n'+"@import './src/blocks/" + blockName + '/' + blockName + '\';'; // строка удаления из scss
  let includeStrPug = '\n'+'include ../blocks/' + blockName + '/' + blockName + '.pug'; // строка удаления из pug
  fs.exists(blockDelName, function(exists){
    if(exists){ // если каталог существует удаляем его
      rmdir(blockDelName, function (err, dirs, files) { //удаление каталога
        console.log(dirs);
        console.log(files);
        console.log('все файлы удалены');
      });
      // обновление style.scss
      fs.readFile('src/styles/style.scss', 'utf8', function(err, contents) { // читаем файл
        if(!err){
          let fileText = contents.replace(new RegExp(includeStrScss,'g'),''); // заменяем ненужную строку подключения
          fs.writeFile('src/styles/style.scss',fileText,function(){ // переписываем файл
            console.log('Файл style.scss обновлен');
          });
        }else{
          console.log('Ошибка обновления файлы "style.scss" ' + err);
        }
      });
      // обновление blocks.pug
      fs.readFile('src/templates/blocks.pug', 'utf8', function(err, contents) { // читаем файл
        if(!err){
          let fileText = contents.replace(new RegExp(includeStrPug,'g'),''); // заменяем ненужную строку подключения
          fs.writeFile('src/templates/blocks.pug',fileText,function(){ // переписываем файл
            console.log('Файл block.pug обновлен');
          });
        }else{
          console.log('Ошибка обновления файлы "block.pug" ' + err);
        }
      });
    }else{
      console.log('Блок "' + blockName + '" не существует!');
    }
  });

}

// Оставить в массиве только уникальные значения (убрать повторы)
function uniqueArray(arr) {
  let objectTemp = {};
  for (let i = 0; i < arr.length; i++) {
    let str = arr[i];
    objectTemp[str] = true; // запомнить строку в виде свойства объекта
  }
  return Object.keys(objectTemp);
}

// Проверка существования файла
function fileExist(path) {
  try {
    fs.statSync(path);
  } catch(err) {
    return !(err && err.code === 'ENOENT');
  }
}
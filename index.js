const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const colors = require('colors')
const getExifTime = require('./exif')

const srcFolder = './src/'
const outFolder = './out/'

const zeroPrefix = digit => digit < 10 ? `0${digit}` : `${digit}`

const copyFile = (source, target) => new Promise((resolve) => {
  const rd = fs.createReadStream(source)
  rd.on('error', function(err) {
    throw new Error(`Error while copying the file "${source}"`.bgRed.yellow)
  })

  const wr = fs.createWriteStream(target)
  wr.on('error', (err) => {
    throw new Error(`Error while copying the file "${source}"`.bgRed.yellow)
  })

  wr.on('close', (ex) => {
    resolve()
  })

  rd.pipe(wr)
})  

const makeDir = (dirPath) => new Promise((resolve) => {
  mkdirp(dirPath, (err) => {
    if (err) {
      throw new Error(`Error while creating dir "${dirPath}"`.bgRed.yellow)
      return
    }
    resolve()
  })
})

const resolveStats = (resolve, stats, ext) => {
  let time = stats.mtime
  const t = new Date(time)
  
  const fd = {
    year: t.getFullYear(),
    month: zeroPrefix(t.getMonth() + 1),
    day: zeroPrefix(t.getDate()),
    hour: zeroPrefix(t.getHours()),
    minutes: zeroPrefix(t.getMinutes()),
    seconds: zeroPrefix(t.getSeconds()),
    ext,
  }

  fd.newFileName = `${fd.year}${fd.month}${fd.day}_${fd.hour}${fd.minutes}${fd.seconds}${fd.ext}`
  fd.sortPath = `./out/${fd.year}/${fd.month}`

  resolve({ fd, stats })
}

const getNewFileName = (t) => `${t.year}${t.month}${t.day}_${t.hour}${t.minutes}${t.seconds}${t.ext}`
const getSortPath = (t) => `./out/${t.year}/${t.month}`


const getStats = (filePath) => new Promise((resolve) => {
  fs.stat(filePath, (err, stats) => {
    if (err) {
      throw new Error(`Cannot get file stats for ${filePath}`)
      return
    }

    const ext = path.extname(filePath)

    if (ext.toLowerCase() === '.jpg') {
      getExifTime(filePath).then(exifTime => {
        const fD = {
          newFileName: getNewFileName(exifTime),
          sortPath: getSortPath(exifTime),
          ext,
        }
        resolve(fD)
        return
      }).catch(() => {
        resolveStats(resolve, stats, ext)
      })
    }

    resolveStats(resolve, stats, ext)
  })
})


const sort = async (file) => {
  const filePath = `${srcFolder}${file}`
  try {
    const { fd, stats } = await getStats(filePath)
    const newPath = `${fd.sortPath}/${fd.newFileName}`

    console.log(`\n${filePath.gray} -> ${fd.sortPath.blue}/${fd.newFileName.blue.bold}`)
  
    if (fs.existsSync(newPath)) {
      throw new Error(`File "${newPath}" exists.`.red)
      return
    }
  
    console.log('make dir')
    await makeDir(fd.sortPath)
    console.log(filePath, newPath)
    await copyFile(filePath, newPath)
  
    fs.utimesSync(newPath, stats.atime, stats.mtime)
  } catch (err) {
    console.log(err.message)
    console.log(`File ${filePath} has not been copied!!`.bgRed.yellow)
  }
}

const runSorter = () => {
  const list = fs.readdirSync(srcFolder)
  list.forEach(async (file) => {
    await sort(file)
  })
}

runSorter()



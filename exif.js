const ExifImage = require('exif').ExifImage

const getExifTime = async (filePath) => new Promise(resolve => {
  try {
    new ExifImage({ image : filePath }, (error, exifData) => {
      if (error) {
        throw new Error('Error on reading EXIF metadata')
        return
      }

      let time   
      if (exifData.exif && exifData.exif.CreateDate) {
        time = exifData.exif.CreateDate
      } else if (exifData.exif && exifData.exif.DateTimeOriginal) {
        time = exifData.exif.DateTimeOriginal
      } else if (exifData.image && exifData.image.ModifyDate) {
        time = exifData.image.ModifyDate
      }

      if (!time) {
        throw new Error('Error on reading EXIF metadata')
        return
      }

      const d = time.split(' ')[0]
      const t = time.split(' ')[1]

      const dateParts = d.split(':')
      const timeParts = t.split(':')
      
      const fd = {
        year: dateParts[0],
        month: dateParts[1],
        day: dateParts[2],
        hour: timeParts[0],
        minutes: timeParts[1],
        seconds: timeParts[2],
      }
  
      resolve(fd)              
    })
  } catch (error) {
    throw new Error('Error on reading EXIF metadata')
    return
  }
})

export default getExifTime
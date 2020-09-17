const {
    PDFDocument,
    StandardFonts,
    rgb
} = require('pdf-lib');
//const {PDFNet} = require('@pdftron/pdfnet-node')
const fs = require('fs');

class BookMark {
    async bookmarkPdf(mergedFile, fileList) {

        const doc = await PDFNet.PDFDoc.createFromURL(`${__basedir}/public/uploads/${mergedFile}`);

        _.forEach(fileList, async fl => {
            const mergePdf = await PDFNet.Bookmark.create(doc, );
            doc.addRootBookmark(mergePdf);
        })
        const key = 'Title';
        mergePdf.setAction(await PDFNet.Action.createGotoWithKey(key, await PDFNet.Destination.createFit(await doc.getPage(1))));
        PDFNet.shutdown();
    }
}

const convertToPdf = async (req, res) => {

    const folderPath = `${__basedir}/public/uploads/`
    console.log('----->start')
    let filesArr = []

    try {
        console.log('req.body.files', req.body.files)

        var i = 1;
        _.forEach(req.body.files, x => {
            _.forEach(x.filePaths, y => {
                //  console.log('req.body.files', req.body.files)
                filesArr.push({
                    index: i++,
                    fileHeader: x.fileHeader,
                    filePath: y.filePath,
                    extension: y.extension
                });
            });
        });
        console.log('filesArr', filesArr)

        if (filesArr.length <= 0) {
            res.status(200).send(apiResponse.errorFormat(`fail`, `No Files found`, result, []));
        } else {
            const mergedPdf = await PDFDocument.create();

            const mergeFileName = `allfiles/MergedPDF${moment().valueOf()}.pdf`
            for (const pdfCopyDoc of filesArr) {

                let filePath = `${folderPath}` + pdfCopyDoc.filePath;

                if (fs.existsSync(filePath)) {

                    console.log('File present :', pdfCopyDoc.fileHeader, '==>', pdfCopyDoc.filePath)
                    const pdfBytes = fs.readFileSync(filePath);

                    //if (pdfCopyDoc.extension == "pdf" || pdfCopyDoc.extension == "PDF" || pdfCopyDoc.extension == "PNG" || pdfCopyDoc.extension == "png" || pdfCopyDoc.extension == "jpg" || pdfCopyDoc.extension == "JPG")
                    //  mergedPdf.text(pdfCopyDoc.fileHeader)
                    const timesRomanFont = await mergedPdf.embedFont(StandardFonts.TimesRoman)
                    const fontSize = 15
                    if (pdfCopyDoc.extension == "pdf" || pdfCopyDoc.extension == "PDF") {
                        console.log('in pdf', pdfCopyDoc.filePath)
                        const pdf = await PDFDocument.load(pdfBytes);
                        const pageIndices = Array.from(pdf.getPages().keys());
                        const copiedPages = await mergedPdf.copyPages(pdf, pageIndices);

                        copiedPages.forEach((page, i) => {
                            if (i == 0) {
                                const {
                                    width,
                                    height
                                } = page.getSize()
                                page.drawText('INVOICE No : ' + pdfCopyDoc.fileHeader, {
                                    x: 50,
                                    y: height - 4 * fontSize,
                                    size: fontSize,
                                    font: timesRomanFont,
                                    color: rgb(0, 0.53, 0.71),
                                })
                            }
                            mergedPdf.addPage(page);
                        });
                    }
                    if (pdfCopyDoc.extension == "png" || pdfCopyDoc.extension == "PNG" || pdfCopyDoc.extension == "jpg" || pdfCopyDoc.extension == "JPG") {

                        const page = mergedPdf.addPage();
                        const {
                            width,
                            height
                        } = page.getSize()

                        if (pdfCopyDoc.extension == "png" || pdfCopyDoc.extension == "PNG") {
                            fl = await mergedPdf.embedPng(pdfBytes, {
                                left: 55,
                                bottom: 485,
                                right: 300,
                                top: 575,
                            });

                        } else if (pdfCopyDoc.extension == "jpg" || pdfCopyDoc.extension == "JPG") {
                            fl = await mergedPdf.embedJpg(pdfBytes, {
                                left: 55,
                                bottom: 485,
                                right: 300,
                                top: 575,
                            });
                        }
                        page.drawText('INVOICE No : ' + pdfCopyDoc.fileHeader, {
                            x: 50,
                            y: height - 4 * fontSize,
                            size: fontSize,
                            font: timesRomanFont,
                            color: rgb(0, 0.53, 0.71),
                        })

                        let imgSize;
                        if (page.getWidth() < fl.width) {
                            let minw = Math.floor((page.getWidth() / fl.width) * 100)
                            //imgSize = fl.scale(minw / 100)
                        }
                        if (page.getHeight() < fl.height) {
                            let minh = Math.floor(page.getHeight() / fl.height * 100)
                            // imgSize = fl.scale(minh / 100)
                        }

                        imgSize = fl.scale(0.5)
                        console.log(' imgSize.width', imgSize.width, ' imgSize.height', imgSize.height)
                        page.drawImage(fl, {
                            x: page.getWidth() / 2 - imgSize.width / 2,
                            y: page.getHeight() / 2 - imgSize.height / 2,
                            width: imgSize.width,
                            height: imgSize.height
                        })

                    }
                }
            }
            fs.writeFileSync(`${folderPath}/` + mergeFileName, await mergedPdf.save());

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-disposition', `attachment; filename=MergedPDF${moment().valueOf()}.pdf`);
            var readStream = fs.createReadStream(`${folderPath}/` + mergeFileName);
            readStream.pipe(res);
            await fs.unlinkSync(`${folderPath}/` + mergeFileName)
        }
    } catch (err) {
        console.log('Error while Merge to file', err)
        const errorObj = {
            code: `err_001`,
            message: errorCode.err_001
        }
        res.status(400).send(apiResponse.errorFormat(`fail`, `Failed to merging pdfs`, errorObj, []));
    }
}
module.exports = {
    convertToPdf
};
// Build a .docx file containing the e-signature image + disclaimer image,
// using exactly the same dimensions and page setup as the Python tool's
// create_docx.py (which mirrors the reference Amirul Zulkifli.docx).
//
// Reference dimensions (EMU):
//   Signature:  5,731,059 x 1,585,593 EMU
//   Disclaimer: 5,731,510 x   763,905 EMU
//   A4 page:    21 cm x 29.7 cm, 1-inch (2.54 cm) margins
//   Paragraph spacing-after: 120 DXA
//
// docx-js takes image dimensions in pixels at 96 DPI:
//   EMU → px:  emu / 914400 inches × 96 px/in  =  emu / 9525
//
//   Signature:  601.69 x 166.49 px
//   Disclaimer: 601.74 x  80.20 px

import {
  Document, Packer, Paragraph, ImageRun, TextRun,
  PageOrientation,
} from 'docx'

const SIG_W_PX = 5_731_059 / 9525   // 601.69
const SIG_H_PX = 1_585_593 / 9525   // 166.49
const DIS_W_PX = 5_731_510 / 9525   // 601.74
const DIS_H_PX =   763_905 / 9525   //  80.20

// A4 dimensions in DXA (1 cm = 567 DXA)
const A4_W_DXA = 11906   // 21 cm
const A4_H_DXA = 16838   // 29.7 cm
const MARGIN_DXA = 1440  // 1 inch (2.54 cm)

/**
 * Build a .docx Blob containing the signature image followed by the disclaimer.
 *
 * @param {Blob|ArrayBuffer|Uint8Array} sigImage  - JPEG bytes for the signature
 * @param {ArrayBuffer|Uint8Array}      disclaimerImage - JPEG bytes for the disclaimer
 * @returns {Promise<Blob>} .docx blob
 */
export async function buildSignatureDocxBlob(sigImage, disclaimerImage) {
  const sigData = await asArrayBuffer(sigImage)
  const disData = await asArrayBuffer(disclaimerImage)

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: {
            width: A4_W_DXA,
            height: A4_H_DXA,
            orientation: PageOrientation.PORTRAIT,
          },
          margin: {
            top: MARGIN_DXA,
            right: MARGIN_DXA,
            bottom: MARGIN_DXA,
            left: MARGIN_DXA,
          },
        },
      },
      children: [
        new Paragraph({
          spacing: { after: 120 },  // 120 DXA, same as reference doc
          children: [
            new ImageRun({
              type: 'jpg',
              data: sigData,
              transformation: { width: SIG_W_PX, height: SIG_H_PX },
            }),
            new TextRun({ break: 1 }),  // line break inside same paragraph
            new ImageRun({
              type: 'jpg',
              data: disData,
              transformation: { width: DIS_W_PX, height: DIS_H_PX },
            }),
          ],
        }),
      ],
    }],
  })

  return await Packer.toBlob(doc)
}

async function asArrayBuffer(input) {
  if (input instanceof ArrayBuffer) return input
  if (input instanceof Uint8Array) return input.buffer
  if (input instanceof Blob) return await input.arrayBuffer()
  throw new Error('Unsupported image data type: ' + Object.prototype.toString.call(input))
}

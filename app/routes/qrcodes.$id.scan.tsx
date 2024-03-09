import { redirect, type LoaderFunction } from '@remix-run/node'
import invariant from 'tiny-invariant'
import db from '../db.server'
import { getDestinationUrl } from '../models/QRCode.server'

export const loader: LoaderFunction = async ({ params }) => {
  invariant(params.id, 'could not find QR code destination')

  const id = +params.id
  const qrCode = await db.qRCode.findFirst({ where: { id } })

  invariant(qrCode, 'could not find QR code destination')

  await db.qRCode.update({
    where: { id },
    data: { scans: { increment: 1 } },
  })

  return redirect(getDestinationUrl(qrCode))
}

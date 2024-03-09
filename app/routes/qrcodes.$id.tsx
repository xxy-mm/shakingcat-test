import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import invariant from 'tiny-invariant'
import { getQRCodeImage } from '~/models/QRCode.server'
import db from '../db.server'
export const loader = async ({ params }: LoaderFunctionArgs) => {
  invariant(params.id, 'Could not find QR code destination')
  const id = +params.id
  const qrCode = await db.qRCode.findFirst({ where: { id } })

  invariant(qrCode, 'Could not find QR code destination')

  return json({
    title: qrCode.title,
    image: await getQRCodeImage(id),
  })
}

export default function QRCode() {
  const { image, title } = useLoaderData<typeof loader>()

  return (
    <>
      <h1>{title}</h1>
      <img src={image} alt="QR Code for product" />
    </>
  )
}

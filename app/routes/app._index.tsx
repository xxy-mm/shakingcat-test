import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import { useLoaderData, useNavigate } from '@remix-run/react'
import type { Action } from '@shopify/polaris'
import {
  Card,
  EmptyState,
  Icon,
  IndexTable,
  InlineStack,
  Layout,
  Link,
  Page,
  Text,
  Thumbnail,
} from '@shopify/polaris'
import { AlertDiamondIcon, ImageIcon } from '@shopify/polaris-icons'
import type { SupplementedQRCode } from '~/models/QRCode.server'
import { getQRCodes } from '~/models/QRCode.server'
import { authenticate } from '../shopify.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request)
  const qrCodes: SupplementedQRCode[] = await getQRCodes(
    session.shop,
    admin.graphql,
  )
  return json({
    qrCodes,
  })
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request)
  const color = ['Red', 'Orange', 'Yellow', 'Green'][
    Math.floor(Math.random() * 4)
  ]
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        input: {
          title: `${color} Snowboard`,
          variants: [{ price: Math.random() * 100 }],
        },
      },
    },
  )
  const responseJson = await response.json()

  return json({
    product: responseJson.data?.productCreate?.product,
  })
}
const EmptyQRCodeState = ({ onAction }: { onAction?: Action['onAction'] }) => (
  <EmptyState
    heading="Create unique QR codes for your product"
    action={{
      content: 'Create QR code',
      onAction,
    }}
    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
  >
    <p>Allow customers to scan codes and buy products using their phones.</p>
  </EmptyState>
)

const QRTable = ({ qrCodes }: { qrCodes: SupplementedQRCode[] }) => (
  <IndexTable
    resourceName={{
      singular: 'QR code',
      plural: 'QR codes',
    }}
    headings={[
      { title: 'Thumbnail', hidden: true },
      { title: 'Title' },
      { title: 'Product' },
      { title: 'Date created' },
      { title: 'Scans' },
    ]}
    itemCount={qrCodes.length}
    selectable={false}
  >
    {qrCodes.map(qrCode => (
      <QRTableRow key={qrCode.id} qrCode={qrCode} />
    ))}
  </IndexTable>
)

const QRTableRow = ({ qrCode }: { qrCode: SupplementedQRCode }) => (
  <IndexTable.Row id={qrCode.id.toString()} position={qrCode.id}>
    <IndexTable.Cell>
      <Thumbnail
        source={qrCode.productImage || ImageIcon}
        alt={qrCode.productTitle}
        size="small"
      />
    </IndexTable.Cell>
    <IndexTable.Cell>
      <Link url={`qrcodes/${qrCode.id}`}>{truncate(qrCode.title)}</Link>
    </IndexTable.Cell>
    <IndexTable.Cell>
      {qrCode.productDeleted ? (
        <InlineStack align="start" gap="200">
          <span style={{ width: '20px' }}>
            <Icon source={AlertDiamondIcon} tone="critical" />
          </span>
          <Text tone="critical" as="span">
            product has been deleted
          </Text>
        </InlineStack>
      ) : (
        truncate(qrCode.productTitle)
      )}
    </IndexTable.Cell>
    <IndexTable.Cell>
      {new Date(qrCode.createdAt).toDateString()}
    </IndexTable.Cell>
    <IndexTable.Cell>{qrCode.scans}</IndexTable.Cell>
  </IndexTable.Row>
)
export default function Index() {
  const { qrCodes } = useLoaderData() as unknown as {
    qrCodes: SupplementedQRCode[]
  }
  const navigate = useNavigate()

  return (
    <Page>
      <ui-title-bar title="QR codes">
        <button variant="primary" onClick={() => navigate('/app/qrcodes/new')}>
          Create QR code
        </button>
      </ui-title-bar>
      <Layout>
        <Layout.Section>
          <Card padding="0">
            {qrCodes.length === 0 ? (
              <EmptyQRCodeState onAction={() => navigate('/app/qrcodes/new')} />
            ) : (
              <QRTable qrCodes={qrCodes} />
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  )
}

function truncate(str: string, { length = 25 } = {}) {
  if (!str) return ''
  if (str.length <= length) return str
  return str.slice(0, length) + '…'
}

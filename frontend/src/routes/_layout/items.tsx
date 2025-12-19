import {
  Box,
  Button,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { ItemsService } from "@/client"

const itemsSearchSchema = z.object({
  page: z.number().catch(1),
})

const PER_PAGE = 5

function getItemsQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      ItemsService.readItems({
        query: { skip: (page - 1) * PER_PAGE, limit: PER_PAGE },
      }),
    queryKey: ["items", { page }],
  }
}

export const Route = createFileRoute("/_layout/items")({
  component: Items,
  validateSearch: (search) => itemsSearchSchema.parse(search),
})

function ItemsTable() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page } = Route.useSearch()
  const { data, isLoading } = useQuery({
    ...getItemsQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  })
  const setPage = (page: number) => {
    navigate({
      to: "/items",
      search: (prev) => ({ ...prev, page }),
    })
  }
  const items = data?.data?.data?.slice(0, PER_PAGE) ?? []
  const count = data?.data?.count ?? 0
  if (isLoading) {
    return <Typography>Loading...</Typography>
  }
  if (items.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="h6">You don't have any items yet</Typography>
        <Typography variant="body2" color="text.secondary">
          Add a new item to get started
        </Typography>
      </Box>
    )
  }
  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items?.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.id}</TableCell>
                <TableCell>{item.title}</TableCell>
                <TableCell>{item.description || "N/A"}</TableCell>
                <TableCell>
                  <Button size="small">Actions</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2, gap: 1 }}>
        <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Previous
        </Button>
        <Typography sx={{ alignSelf: "center", px: 2 }}>
          Page {page} of {Math.ceil(count / PER_PAGE)}
        </Typography>
        <Button
          disabled={page >= Math.ceil(count / PER_PAGE)}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </Box>
    </>
  )
}

function Items() {
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ pt: 3, pb: 2 }}>
        Items Management
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Button variant="contained">Add Item</Button>
      </Box>
      <ItemsTable />
    </Container>
  )
}

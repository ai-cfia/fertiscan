import {
  Badge,
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
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { type UserPublic, UsersService } from "@/api"

const usersSearchSchema = z.object({
  page: z.number().catch(1),
})

const PER_PAGE = 5

function getUsersQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      UsersService.readUsers({
        query: { skip: (page - 1) * PER_PAGE, limit: PER_PAGE },
      }),
    queryKey: ["users", { page }],
  }
}

export const Route = createFileRoute("/_layout/admin")({
  component: Admin,
  validateSearch: (search) => usersSearchSchema.parse(search),
})

function UsersTable() {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const navigate = useNavigate({ from: Route.fullPath })
  const { page } = Route.useSearch()
  const { data, isLoading } = useQuery({
    ...getUsersQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  })
  const setPage = (page: number) => {
    navigate({
      to: "/admin",
      search: (prev) => ({ ...prev, page }),
    })
  }
  const users = data?.data?.data?.slice(0, PER_PAGE) ?? []
  const count = data?.data?.count ?? 0
  if (isLoading) {
    return <Typography>Loading...</Typography>
  }
  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Full name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  {user.first_name && user.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user.first_name || user.last_name || "N/A"}
                  {currentUser?.id === user.id && (
                    <Badge sx={{ ml: 1 }} color="primary">
                      You
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.is_superuser ? "Superuser" : "User"}
                </TableCell>
                <TableCell>{user.is_active ? "Active" : "Inactive"}</TableCell>
                <TableCell>
                  <Button size="small" disabled={currentUser?.id === user.id}>
                    Actions
                  </Button>
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

function Admin() {
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ pt: 3, pb: 2 }}>
        Users Management
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Button variant="contained">Add User</Button>
      </Box>
      <UsersTable />
    </Container>
  )
}

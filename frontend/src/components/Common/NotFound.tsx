import { Button, Typography } from "@mui/material"
import { Link } from "@tanstack/react-router"

const NotFound = () => {
  return (
    <div
      className="w-full h-screen flex items-center justify-center flex-col p-4"
      data-testid="not-found"
    >
      <div className="flex flex-col items-center justify-center">
        <Typography
          variant="h1"
          className="text-6xl md:text-8xl font-bold leading-none mb-4"
        >
          404
        </Typography>
        <Typography variant="h3" className="font-bold mb-2">
          Oops!
        </Typography>
      </div>
      <Typography variant="body1" className="text-gray-600 mb-4 text-center">
        The page you are looking for was not found.
      </Typography>
      <div className="flex justify-center">
        <Link to="/">
          <Button variant="contained" color="primary" className="mt-4">
            Go Back
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default NotFound

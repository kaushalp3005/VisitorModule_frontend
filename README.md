# Visitor Module Frontend

A Next.js-based frontend application for managing visitor check-ins, appointments, and admin operations.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (version 18.x or higher)
- **npm** (comes with Node.js) or **yarn**

You can check your versions by running:
```bash
node --version
npm --version
```

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kaushalp3005/VisitorModule_frontend.git
   cd VisitorModule_frontend
   ```

2. **Install dependencies**
   
   This is equivalent to running `pip install -r requirements.txt` in Python projects. For Node.js projects, we use:
   ```bash
   npm install
   ```
   
   This command will read the `package.json` file and install all required dependencies listed in the `dependencies` and `devDependencies` sections.

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory (if needed) with your configuration:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

## Running the Application

### Development Mode

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

Build the application for production:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint to check code quality

## Project Structure

```
frontend/
├── app/                    # Next.js app directory (pages and routes)
│   ├── admin/              # Admin dashboard pages
│   ├── appointment/        # Appointment management pages
│   ├── dashboard/          # Approver dashboard
│   └── ...
├── components/             # React components
│   ├── ui/                 # UI component library
│   └── ...
├── lib/                    # Utility functions and stores
├── public/                 # Static assets
├── styles/                 # Global styles
├── package.json            # Dependencies (like requirements.txt)
└── README.md              # This file
```

## Dependencies

All project dependencies are managed through `package.json`. Key dependencies include:

- **Next.js 16.0.3** - React framework
- **React 19.2.0** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Radix UI** - Component primitives
- **React Hook Form** - Form management
- **Zod** - Schema validation

For a complete list, see `package.json`.

## Troubleshooting

### Issue: `npm install` fails

**Solution:** 
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` folder and `package-lock.json`
- Run `npm install` again

### Issue: Port 3000 already in use

**Solution:**
- Stop the process using port 3000, or
- Run on a different port: `npm run dev -- -p 3001`

### Issue: Module not found errors

**Solution:**
- Ensure all dependencies are installed: `npm install`
- Check that `node_modules` folder exists
- Verify `package.json` has all required dependencies

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

[Add your license information here]

## Support

For issues and questions, please contact the development team or create an issue in the repository.

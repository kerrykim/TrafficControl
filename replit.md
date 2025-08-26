# Incheon International Airport Expressway Traffic Control Application

## Overview

This is a Korean traffic control data search application for Incheon International Airport Expressway that allows users to search and view traffic control information by date and/or employee name. The application displays traffic control details including project names, locations, workers, contractors, and contact information. It features a clean, modern web interface with Korean language support and road-themed styling.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Single Page Application (SPA)**: Built with vanilla HTML, CSS, and JavaScript without frameworks
- **Responsive Design**: Mobile-first approach using CSS Grid and Flexbox
- **Modern UI/UX**: Material design principles with construction-themed icons from Font Awesome
- **Korean Language Support**: Full Korean localization with proper font handling (Malgun Gothic)

### Data Management
- **Static Data Store**: Construction data stored in a JavaScript file (`data.js`) as a JSON array
- **Client-Side Filtering**: Date-based search functionality implemented entirely in JavaScript
- **No Backend Required**: All data processing happens in the browser

### Core Components
- **Search Interface**: Date picker and employee name input with search/clear buttons
- **Results Display**: Dynamic table generation showing filtered traffic control data
- **Loading States**: User feedback during search operations with loading indicators
- **Error Handling**: No results state with appropriate messaging

### Data Structure
The application handles traffic control records with the following key fields:
- Date information (input date, block date)
- Project details (construction name, direction, location)
- Resource allocation (workers, vehicles, equipment)
- Contact information (employees, contractors, site managers)
- Work specifications (lane closures, time restrictions)

### Styling Architecture
- **CSS Custom Properties**: Consistent color scheme and spacing
- **Gradient Backgrounds**: Modern visual appeal with purple-to-blue gradients
- **Shadow and Blur Effects**: Depth and modern aesthetics
- **Icon Integration**: Font Awesome icons for visual hierarchy and user guidance

## External Dependencies

### CDN Resources
- **Font Awesome 6.0.0**: Icon library for UI elements and visual enhancement
- Loaded via CDN: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css`

### Data Source
- **TSV to JavaScript Conversion**: Original data appears to be from TSV format converted to JavaScript objects
- No external APIs or databases required
- All data is bundled with the application

### Browser Requirements
- Modern browser support for ES6+ features
- Date input type support for the search functionality
- CSS Grid and Flexbox support for responsive layout
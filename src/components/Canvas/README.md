# Canvas Component - Save & Load Feature

## Overview

The Canvas component now supports **saving and loading canvas projects** in JSON format. This feature allows users to:
- Save their canvas work with all elements fully editable
- Download canvas as a JSON file
- Upload previously saved JSON files to continue editing
- Preserve all images, text, connections, arrows, and background settings

Unlike exporting as PNG (which creates a static image), the JSON save feature maintains **complete editability** of all canvas elements.

---

## Feature Introduction

### What is the Canvas Save/Load Feature?

This feature enables users to **save their canvas state** and restore it later without losing any editing capabilities. When you save a canvas as JSON:

1. **All elements are preserved**: Images, text boxes, mentor cards, connections, and arrows
2. **Positions and properties maintained**: Element positions, sizes, rotations, colors, and styling
3. **Images remain editable**: Both uploaded images and Unsplash images are saved correctly
4. **Background settings saved**: Background images and scale settings are preserved
5. **Full restoration**: When loaded, the canvas is restored exactly as it was saved

### Use Cases

- **Work-in-Progress**: Save unfinished canvas projects and continue editing later
- **Version Control**: Create multiple versions of your canvas design
- **Backup**: Keep backup copies of important canvas work
- **Sharing**: Share editable canvas files with collaborators
- **Templates**: Save canvas templates for reuse

---

## Technical Implementation

### Architecture Overview

The save/load feature is implemented using a **JSON-based serialization system** that:

1. **Export Process**: Converts canvas state → JSON file
   - Serializes all canvas elements and their properties
   - Converts temporary blob URLs to permanent base64 data URLs
   - Packages everything into a downloadable JSON file

2. **Import Process**: Restores JSON file → canvas state
   - Parses and validates JSON structure
   - Converts base64 back to blob URLs for performance
   - Rebuilds all elements with original properties

---

## Files & Components Added/Modified

### 1. **Core Functions (CanvasContext.jsx)**

**File**: `src/components/Canvas/Utils/CanvasContext.jsx`

#### New Functions Added:

##### `convertBlobUrlToBase64(url)` (Line 580)
- **Purpose**: Helper function to convert temporary blob URLs to base64 data URLs
- **Why**: Blob URLs (like `blob:https://...`) only exist in the current browser session. To save images in JSON, we need permanent base64 strings.
- **Process**:
  1. Fetches the blob from the object URL
  2. Uses FileReader to convert blob to base64
  3. Returns a data URL (e.g., `data:image/png;base64,iVBORw0KG...`)

##### `exportCanvasAsJSON(fileName)` (Line 617)
- **Purpose**: Main export function that saves canvas as JSON file
- **What it saves**:
  - All elements (text, images, mentors) with positions, sizes, rotations, scales
  - All connections between elements (startId, endId, color, thickness)
  - All arrows between elements
  - Background image and scale settings
  - Metadata (version number, export date)
- **Image handling**:
  - **Uploaded images**: Converts blob URLs → base64 (for portability)
  - **Unsplash images**: Keeps original URLs (more efficient, no conversion needed)
  - **Mentor images**: Converts blob → base64 if needed
- **Output**: Downloads a formatted JSON file with 2-space indentation

##### `importCanvasFromJSON(file)` (Line 799)
- **Purpose**: Main import function that loads canvas from JSON file
- **What it restores**:
  - All elements with exact positions and properties
  - All connections and arrows
  - Background image and scale
  - Clears any current selections for clean state
- **Validation**:
  - Checks for required `version` field
  - Validates `elements` is an array
  - Provides detailed error messages if validation fails
- **Image handling**:
  - **Base64 images**: Converts back to blob URLs (better browser performance)
  - **Regular URLs**: Uses as-is (Unsplash images)
- **User feedback**: Shows success message and logs statistics (element count, connections, arrows)

#### Context Value Updates (Line 1246-1247)
- Exported `exportCanvasAsJSON` and `importCanvasFromJSON` to make them available throughout the component tree

---

### 2. **Export Panel (ExportPanel.jsx)**

**File**: `src/components/Canvas/Components/Elements/ToolBar/Panels/ExportPanel.jsx`

#### Changes Made:
- **Updated UI** to show two export options instead of one
- **Added "Save Canvas as JSON" button** (blue button)
  - Icon: `IoSave` (save icon)
  - Calls `handleExportJSON()` when clicked
  - Description: Explains JSON format preserves editability
- **Kept "Download as PNG" button** (green button)
  - Icon: `IoDownload` (download icon)
  - Existing functionality for static image export
- **Added informational sections**:
  - **JSON Format Info** (purple panel): Explains benefits (editable, smaller file size, etc.)
  - **PNG Export Tips** (blue panel): Existing export tips
- **Props**: Now accepts `handleExportJSON` in addition to `handleExport`

---

### 3. **Import Panel (ImportPanel.jsx)** - NEW FILE

**File**: `src/components/Canvas/Components/Elements/ToolBar/Panels/ImportPanel.jsx`

#### Purpose:
New component that provides UI for importing previously saved canvas JSON files.

#### Features:
- **File input** with JSON-only validation (`.json` files)
- **Upload button** triggers hidden file input
  - Icon: `IoCloudUpload` (cloud upload icon)
  - Color: Purple theme to match JSON export
- **File validation**:
  - Checks file extension is `.json`
  - Checks file type is `application/json`
  - Shows alert if invalid file selected
- **Informational sections**:
  - **Important Warnings** (yellow panel): Warns that import replaces current canvas
  - **What Gets Restored** (purple panel): Lists all restored elements
  - **How to Use** (blue panel): Step-by-step instructions

#### Key Functions:
- `handleFileChange(event)`: Called when user selects a file
  - Validates file type
  - Calls `handleImport(file)` prop
  - Resets file input for reuse
  - Closes panel after import
- `handleUploadClick()`: Triggers the hidden file input

---

### 4. **ToolBar (ToolBar.jsx)**

**File**: `src/components/Canvas/Components/Elements/ToolBar/ToolBar.jsx`

#### Changes Made:

##### New Imports (Line 3, 15):
- Added `IoCloudUpload` icon for import button
- Added `ImportPanel` component import

##### New Props (Line 27-28):
- `handleExportJSON`: Function to export canvas as JSON
- `handleImport`: Function to import canvas from JSON file

##### BaseToolRegistry Updates (Line 89-100):
- **Added "Import Canvas" tool**:
  - Icon: `IoCloudUpload` (cloud upload)
  - Label: "Import Canvas"
  - Action: Opens import panel
  - Position: Before the export button
- **Updated "Export" tool**:
  - Label changed to "Export Canvas" (for clarity)

##### Panel Rendering (Line 206-210):
- **Added ImportPanel rendering** (Line 206):
  - Renders when `activePanel === 'import'`
  - Passes `handleImport` prop
  - Passes `onClose` for panel dismissal
- **Updated ExportPanel rendering** (Line 208-210):
  - Now passes both `handleExport` and `handleExportJSON`

---

### 5. **RenderCanvas (RenderCanvas.jsx)**

**File**: `src/components/Canvas/Layout/RenderCanvas.jsx`

#### Changes Made:

##### Context Destructuring (Line 23-24):
- Added `exportCanvasAsJSON` from canvas context
- Added `importCanvasFromJSON` from canvas context

##### New Handler Functions:

###### `handleExportJSON()` (Line 211-214):
- **Purpose**: Wrapper function to export canvas as JSON
- **Functionality**:
  - Generates filename: `canvas-YYYY-MM-DD.json`
  - Calls `exportCanvasAsJSON(fileName)`
- **Why needed**: Provides consistent naming convention and date stamping

###### `handleImport(file)` (Line 224-240):
- **Purpose**: Wrapper function to import canvas from JSON file
- **Functionality**:
  1. Shows confirmation dialog (warns user that import replaces current canvas)
  2. If user confirms, calls `importCanvasFromJSON(file)`
  3. If import successful, shows success message
  4. If import fails, error is handled in `importCanvasFromJSON`
- **Why needed**: Adds user confirmation layer to prevent accidental data loss

##### ToolBar Props (Line 281-282):
- Passed `handleExportJSON` to ToolBar
- Passed `handleImport` to ToolBar

---

## Data Flow Diagram

### Export Flow:
```
User clicks "Export Canvas"
  → ExportPanel opens
    → User clicks "Save Canvas as JSON"
      → handleExportJSON() in RenderCanvas
        → exportCanvasAsJSON() in CanvasContext
          → Convert blob URLs → base64
            → Create JSON structure
              → Download JSON file
```

### Import Flow:
```
User clicks "Import Canvas"
  → ImportPanel opens
    → User selects JSON file
      → File validation
        → handleImport() in RenderCanvas
          → User confirmation dialog
            → importCanvasFromJSON() in CanvasContext
              → Parse and validate JSON
                → Convert base64 → blob URLs
                  → Update canvas state
                    → Show success message
```

---

## JSON File Structure

### Example Structure:
```json
{
  "version": "1.0",
  "exportDate": "2025-10-04T12:34:56.789Z",
  "elements": [
    {
      "id": "image-1728045678901",
      "type": "image",
      "x": 100,
      "y": 200,
      "width": 300,
      "height": 200,
      "rotation": 0,
      "scale": 1,
      "alt": "My uploaded image",
      "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANS..."
    },
    {
      "id": "text-1728045678902",
      "type": "text",
      "x": 450,
      "y": 150,
      "width": 200,
      "height": 100,
      "rotation": 0,
      "scale": 1,
      "content": "Hello World",
      "fontSize": 24,
      "fontFamily": "Arial",
      "color": "#000000"
    }
  ],
  "connections": [
    {
      "id": "connection-1728045678903",
      "startId": "image-1728045678901",
      "endId": "text-1728045678902",
      "color": "#000000",
      "thickness": 2
    }
  ],
  "arrows": [],
  "backgroundImage": {
    "name": "Background Image",
    "type": "upload",
    "url": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA..."
  },
  "backgroundScale": 100
}
```

### Field Descriptions:

#### Metadata:
- `version`: Format version for future compatibility (currently "1.0")
- `exportDate`: ISO timestamp of when the export was created

#### Elements Array:
Each element has:
- `id`: Unique identifier
- `type`: Element type ("image", "text", or "mentor")
- `x`, `y`: Position coordinates
- `width`, `height`: Element dimensions
- `rotation`: Rotation angle in degrees
- `scale`: Scale factor (1.0 = 100%)

**Type-specific fields**:
- **Image elements**: `dataUrl` (base64) or `src` (URL), `alt`, `attribution`
- **Text elements**: `content`, `fontSize`, `fontFamily`, `color`
- **Mentor elements**: `content`, `fontSize`, `fontFamily`, `color`, `image`

#### Connections Array:
- `id`: Connection identifier
- `startId`: ID of starting element
- `endId`: ID of ending element
- `color`: Line color
- `thickness`: Line width in pixels

#### Arrows Array:
- Same structure as connections
- Includes arrowhead rendering

#### Background Settings:
- `backgroundImage`: Object with `url`, `name`, `type`, `attribution`
- `backgroundScale`: Scale percentage (100 = full size)

---

## Why Base64 for Images?

### The Problem:
When users upload images, the browser creates temporary **blob URLs** like:
```
blob:https://example.com/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

These URLs:
- ❌ Only exist in the current browser session
- ❌ Become invalid when the page is refreshed
- ❌ Cannot be saved to a file
- ❌ Cannot be shared with others

### The Solution:
Convert blob URLs to **base64 data URLs**:
```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...
```

Base64 data URLs:
- ✅ Are self-contained (the image data is in the URL itself)
- ✅ Can be saved in JSON files
- ✅ Work across browser sessions
- ✅ Can be shared with others
- ✅ Are portable across devices

### Performance Optimization:
- **On Export**: Convert blob → base64 (for saving)
- **On Import**: Convert base64 → blob (for better rendering performance)

This hybrid approach gives us the best of both worlds:
- **Portability** when saving (base64)
- **Performance** when rendering (blob URLs)

---

## Error Handling

### Export Errors:
- **Blob conversion fails**: Logs error, uses filename fallback
- **Background conversion fails**: Logs warning, continues export
- **Export fails entirely**: Shows user alert with error details

### Import Errors:
- **Invalid file type**: Alert user to select `.json` file
- **Missing version field**: "Invalid canvas file: missing version"
- **Invalid elements array**: "Invalid canvas file: elements must be an array"
- **JSON parse error**: Shows parse error message to user
- **Image conversion fails**: Logs error, uses base64 directly as fallback

### User Feedback:
- **Export success**: File downloads automatically (browser behavior)
- **Import success**: Alert showing "Canvas imported successfully!"
- **Import failure**: Alert with specific error message
- **Console logging**: Detailed logs for debugging (element counts, conversion status, etc.)

---

## Future Enhancements

Potential improvements for the save/load feature:

1. **Merge Import Option**: Allow importing elements without replacing entire canvas
2. **Auto-save**: Periodic automatic saves to browser localStorage
3. **Version History**: Keep track of multiple save versions
4. **Cloud Storage**: Save/load from cloud storage (Firebase, AWS S3)
5. **Compression**: Compress JSON files for smaller file sizes
6. **Export to Other Formats**: SVG, PDF export options
7. **Partial Export**: Export selected elements only
8. **Import Validation UI**: Show preview before importing
9. **Collaborative Editing**: Real-time multi-user editing
10. **Undo/Redo**: Implement undo/redo for import operations

---

## Testing the Feature

### To Test Export:
1. Create a canvas with various elements (images, text, connections)
2. Click the "Export Canvas" button in the toolbar
3. Click "Save Canvas as JSON"
4. Verify JSON file downloads with correct filename format
5. Open the JSON file in a text editor to verify structure

### To Test Import:
1. Create and export a canvas as JSON
2. Clear or modify the canvas
3. Click the "Import Canvas" button in the toolbar
4. Click "Choose JSON File to Import"
5. Select the previously exported JSON file
6. Confirm the import in the dialog
7. Verify all elements are restored correctly
8. Test that elements are still draggable and editable

### Edge Cases to Test:
- Import with no elements
- Import with only text elements
- Import with only images
- Import with connections but missing elements
- Import corrupted/invalid JSON
- Import from different canvas version
- Multiple imports in sequence
- Large canvases (100+ elements)

---

## Dependencies

No new external dependencies were added. The feature uses only:
- **React** (existing): For components and state management
- **Browser APIs**: FileReader, Blob, URL.createObjectURL
- **React Icons** (existing): For UI icons

---

## Browser Compatibility

The save/load feature works in all modern browsers that support:
- ✅ FileReader API
- ✅ Blob API
- ✅ URL.createObjectURL()
- ✅ JSON.parse() / JSON.stringify()
- ✅ File input with accept attribute

Supported browsers:
- Chrome 76+
- Firefox 69+
- Safari 13+
- Edge 79+

---

## Summary

The Canvas Save/Load feature provides a complete solution for preserving and restoring canvas work. By using JSON format with base64 image encoding, we achieve:

- ✅ **Full editability preservation**
- ✅ **Cross-session persistence**
- ✅ **Portability across devices**
- ✅ **No data loss**
- ✅ **User-friendly interface**
- ✅ **Robust error handling**

This feature significantly enhances the canvas editing experience by allowing users to save their work and return to it later without losing any editing capabilities.

import { render, screen } from '@testing-library/react';  // Import necessary testing functions
import SimpleComponent from '../components/SimpleComponent';  // Adjust the path to where your component is located

test('renders Hello World text', () => {
  render(<SimpleComponent />);  // Render the SimpleComponent
  expect(screen.getByText('Hello World')).toBeInTheDocument();  // Check if "Hello World" is rendered on the screen
});
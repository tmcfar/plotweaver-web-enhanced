import { render, screen } from '@testing-library/react';
import { Layout } from '../Layout';
import { useGlobalStore } from '../../../lib/store';

// Mock the store
jest.mock('../../../lib/store', () => ({
  useGlobalStore: jest.fn(),
}));

describe('Layout Component', () => {
  const mockUseGlobalStore = useGlobalStore as unknown as jest.Mock;

  beforeEach(() => {
    mockUseGlobalStore.mockImplementation(() => ({
      modeSet: 'professional-writer',
    }));
  });

  it('renders correctly for professional-writer mode', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(document.querySelector('.panel-left')).toBeInTheDocument();
    expect(document.querySelector('.panel-right')).toBeInTheDocument();
    expect(document.querySelector('.panel-bottom')).toBeInTheDocument();
  });

  it('does not render when no mode is selected', () => {
    mockUseGlobalStore.mockImplementation(() => ({
      modeSet: null,
    }));

    const { container } = render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('adapts layout based on mode-set configuration - ai-first', () => {
    mockUseGlobalStore.mockImplementation(() => ({
      modeSet: 'ai-first',
    }));

    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    // ai-first mode has left=true, right=true, bottom=false
    expect(document.querySelector('.panel-left')).toBeInTheDocument();
    expect(document.querySelector('.panel-right')).toBeInTheDocument();
    expect(document.querySelector('.panel-bottom')).not.toBeInTheDocument();
  });

  it('adapts layout based on mode-set configuration - hobbyist', () => {
    mockUseGlobalStore.mockImplementation(() => ({
      modeSet: 'hobbyist',
    }));

    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    // hobbyist mode has left=true, right=false, bottom=false
    expect(document.querySelector('.panel-left')).toBeInTheDocument();
    expect(document.querySelector('.panel-right')).not.toBeInTheDocument();
    expect(document.querySelector('.panel-bottom')).not.toBeInTheDocument();
  });
});

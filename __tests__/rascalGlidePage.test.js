/**
 * Tests for app/rascal-glide/page.js — Rascal Glide game page wrapper
 *
 * Tests the page component renders correctly with:
 * - Heading text and emoji
 * - RascalSpaceGlide component with correct props
 * - Instruction text
 * - onTimeUp callback triggers toast
 */

const react = require("react");
const { render, screen } = require("@testing-library/react");

// Mock RascalSpaceGlide component
let capturedProps = {};
jest.mock("../app/components/RascalSpaceGlide", () => {
  const r = require("react");
  return {
    __esModule: true,
    default: function MockRascalSpaceGlide(props) {
      capturedProps = props;
      return r.createElement("div", { "data-testid": "rascal-space-glide" }, "Game");
    },
  };
});

// Mock react-hot-toast
const mockToast = jest.fn();
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: (...args) => mockToast(...args),
}));

// Mock framer-motion
jest.mock("framer-motion", () => {
  const r = require("react");
  return {
    motion: new Proxy({}, {
      get: (_, tag) => r.forwardRef((props, ref) => {
        const { initial, animate, exit, transition, whileHover, whileTap, variants, ...rest } = props;
        return r.createElement(tag, { ...rest, ref });
      }),
    }),
    AnimatePresence: ({ children }) => r.createElement(r.Fragment, null, children),
  };
});

const RascalGlidePage = require("../app/rascal-glide/page").default;

describe("RascalGlidePage", () => {
  beforeEach(() => {
    capturedProps = {};
    mockToast.mockClear();
  });

  it("renders the page heading", () => {
    render(react.createElement(RascalGlidePage));
    expect(screen.getByText(/Rascal Space Glide/)).toBeTruthy();
  });

  it("renders the RascalSpaceGlide component", () => {
    render(react.createElement(RascalGlidePage));
    expect(screen.getByTestId("rascal-space-glide")).toBeTruthy();
  });

  it("passes secondsRemaining=30 to the game", () => {
    render(react.createElement(RascalGlidePage));
    expect(capturedProps.secondsRemaining).toBe(30);
  });

  it("passes onTimeUp callback", () => {
    render(react.createElement(RascalGlidePage));
    expect(typeof capturedProps.onTimeUp).toBe("function");
  });

  it("onTimeUp triggers a toast", () => {
    render(react.createElement(RascalGlidePage));
    capturedProps.onTimeUp();
    expect(mockToast).toHaveBeenCalledWith("⏰ Time's up!", { icon: "🕹️" });
  });

  it("renders instruction text", () => {
    render(react.createElement(RascalGlidePage));
    expect(screen.getByText(/arrow keys to dodge/i)).toBeTruthy();
  });
});

import Button from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: { layout: 'padded' },
  args: { label: 'View case study', size: 'm', radius: 12, hoverRadius: 50, hovered: false },
  argTypes: {
    label: { control: 'text' },
    size: { control: 'inline-radio', options: ['s', 'm', 'l'], description: 'Body text size token' },
    radius: { control: { type: 'number', min: 0, max: 500 }, description: 'Default radius, px' },
    hoverRadius: { control: { type: 'range', min: 0, max: 50, step: 1 }, description: 'Hover radius, % of height (50 = pill)' },
    hovered: { control: 'boolean', description: 'Force the hover state' },
  },
};

export default meta;

export const Default = {};

export const Hovered = { args: { hovered: true } };

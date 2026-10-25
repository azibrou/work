import './sections.css';
import data from './sections.json';
import { FONT_VARS } from './sectionsSchema.js';
import { spaceVar } from '../../tokens/spacing/spacing.js';

const headingStyle = (font, size, color) => ({
  fontFamily: FONT_VARS[font],
  fontSize: `var(--font-size-${size})`,
  lineHeight: `var(--line-height-${size})`,
  fontWeight: `var(--font-weight-${size})`,
  color: `var(${color})`,
});

// Text sections under the home page tiles: an optional headline, then project titles
// with descriptions. Content and styles come from sections.json, edited in Storybook
// under Components/Cards/Doing → Sections.
export default function ProjectSections({ style = data.style, sections = data.sections }) {
  const shown = sections.filter((s) => s.visible);
  if (!shown.length) return null;

  const vars = {
    '--sections-padding-top': spaceVar(style.paddingTop),
    '--sections-padding-bottom': spaceVar(style.paddingBottom),
    '--sections-headline-gap': spaceVar(style.headlineGap),
    '--sections-project-gap': spaceVar(style.projectGap),
    '--sections-title-gap': spaceVar(style.titleGap),
  };
  const headline = headingStyle(style.headlineFont, style.headlineSize, style.headlineColor);
  const title = headingStyle(style.titleFont, style.titleSize, style.titleColor);
  const description = {
    fontFamily: FONT_VARS[style.descriptionFont],
    fontSize: `var(--font-size-body-${style.descriptionSize})`,
    lineHeight: `var(--line-height-body-${style.descriptionSize})`,
    fontWeight: `var(--font-weight-${style.descriptionWeight})`,
    color: `var(${style.descriptionColor})`,
  };

  return (
    <div className="project-sections" style={vars}>
      {shown.map((section) => (
        <section key={section.id} className="project-section" aria-label={section.headlineVisible ? undefined : 'Projects'}>
          {/* Heading levels stay fixed (h2 headline, h3 projects) for page structure; the setup only picks the look. */}
          {section.headlineVisible && (
            <h2 className="project-section__headline" style={headline}>
              {section.headline}
            </h2>
          )}
          <div className="project-section__list">
            {section.projects.map((project, i) => (
              <article key={i} className="project-section__project">
                <h3 style={title}>{project.title}</h3>
                <p style={description}>{project.description}</p>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

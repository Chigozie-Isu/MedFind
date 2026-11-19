import { LOGO_MARK_VIEWBOX, LOGO_VIEWBOX, logoFill, logoPaths, type LogoTone } from '../logo.ts';

export interface LogoProps {
  /** Rendered height in px; width follows the logo's proportions. */
  height?: number;
  tone?: LogoTone;
  /** Only the cross-and-pill mark. */
  markOnly?: boolean;
}

export function Logo({ height = 32, tone = 'colour', markOnly = false }: LogoProps) {
  const vb = markOnly ? LOGO_MARK_VIEWBOX : { x: 0, y: 0, ...LOGO_VIEWBOX };
  const width = (height * vb.width) / vb.height;
  const paths = markOnly ? logoPaths.filter((p) => p.fill.startsWith('mark')) : logoPaths;
  return (
    <svg width={width} height={height} viewBox={`${vb.x} ${vb.y} ${vb.width} ${vb.height}`} role="img" aria-label="MedFind">
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={logoFill(p.fill, tone)} />
      ))}
    </svg>
  );
}

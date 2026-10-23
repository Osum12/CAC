import { safeUrl } from '../services/format';

type Props = {
  url: string | null | undefined;
  label: string;
  /** Shown instead of a link when the URL is missing or invalid. */
  unavailableText: string;
};

/**
 * Renders an outbound source link only when a valid http(s) URL exists.
 * A null URL becomes plain, non-interactive text, never a dead button.
 */
export function SourceAction({ url, label, unavailableText }: Props) {
  const href = safeUrl(url);
  if (!href) {
    return (
      <span className="source-action source-action--unavailable">
        <span aria-hidden="true">⊘</span> {unavailableText}
      </span>
    );
  }
  const cut = label.lastIndexOf(' ') + 1;
  return (
    <a className="source-action" href={href} target="_blank" rel="noopener noreferrer">
      {label.slice(0, cut)}
      <span className="nowrap">
        {label.slice(cut)}
        <span aria-hidden="true">{' '}↗</span>
      </span>
      <span className="visually-hidden"> (opens in a new tab)</span>
    </a>
  );
}

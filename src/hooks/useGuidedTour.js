import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { driver } from 'driver.js';
import { Offcanvas } from 'bootstrap';
import 'driver.js/dist/driver.css';
import '../components/css/tour.css';
import useSessionStore from '../store/useSessionStore';

// ── Shared driver.js config ────────────────────────────────────────────────────
const BASE_CONFIG = {
  showProgress: true,
  showButtons: ['next', 'previous', 'close'],
  progressText: 'Step {{current}} of {{total}}',
  nextBtnText: 'Next →',
  prevBtnText: '← Back',
  doneBtnText: 'Finish Tour ✓',
  popoverClass: 'etms-tour-popover',
  overlayOpacity: 0.70,
  stagePadding: 10,
  stageRadius: 8,
  smoothScroll: true,
  allowClose: true,
};

// ── Profile Page Tour ──────────────────────────────────────────────────────────
// isReady: pass !loading from the calling component so the tour only starts
// after profile data has been fetched and DOM elements are populated.
export function useProfileTour({ isReady = true } = {}) {
  const navigate    = useNavigate();
  const driverRef   = useRef(null);
  const tourPending = useSessionStore((s) => s.tourPending);
  const tourPage    = useSessionStore((s) => s.tourPage);
  const advanceTour = useSessionStore((s) => s.advanceTour);
  const completeTour = useSessionStore((s) => s.completeTour);

  useEffect(() => {
    // Guard: only run when all three conditions are met.
    // isReady = page data has loaded; no magic setTimeout needed.
    if (!tourPending || tourPage !== 'profile' || !isReady) return;

    // Prevent double-instantiation if this effect fires again while running.
    if (driverRef.current) return;

    let isTransitioning = false;
    const LAST_IDX = 5;

    const driverObj = driver({
      ...BASE_CONFIG,
      steps: [
        {
          popover: {
            title: '👋 Welcome to eTMS!',
            description:
              "We're excited to have you on board! Let's take a quick tour to help you get started with the Employee Transport Management System.",
            align: 'center',
          },
        },
        {
          element: '#tour-profile-pic',
          popover: {
            title: '📷 Your Profile Photo',
            description:
              'This is your profile photo. Click on it to upload a custom picture — your team and managers will see it across the platform.',
            side: 'right',
            align: 'center',
          },
        },
        {
          element: '#tour-profile-info',
          popover: {
            title: '📋 Your Contact Details',
            description:
              'Your name, email, and phone number appear here. For any corrections, contact your manager or the support team.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#tour-transport-status',
          popover: {
            title: '🚌 Transport Eligibility',
            description:
              'These badges show your transport eligibility, shuttle usage, and geocode status. Your daily commute service depends on these being active.',
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#tour-personal-details',
          popover: {
            title: '🏠 Personal & Official Details',
            description:
              'Your registered address, pickup point, employee ID, project, facility, and manager are all listed here. Click your address to raise a change request.',
            side: 'left',
            align: 'start',
          },
        },
        {
          popover: {
            title: '📅 Up Next: Schedule Management',
            description:
              "Great — your profile is set! Now let's explore how to manage your team's transport schedules and create rosters.",
            align: 'center',
            nextBtnText: 'Explore Schedules →',
          },
        },
      ],

      onNextClick: () => {
        const idx = driverObj.getActiveIndex();
        if (idx === LAST_IDX) {
          // Transition: advance store state BEFORE destroy so the schedule
          // tour hook's effect fires with the correct page on mount.
          isTransitioning = true;
          advanceTour('schedule');
          driverObj.destroy();
          navigate('/MySchedule');
        } else {
          driverObj.moveNext();
        }
      },

      onDestroyed: () => {
        // Only call completeTour if the user closed the tour (not if we are
        // navigating to the next page — the tour continues on /MySchedule).
        if (!isTransitioning) completeTour();
      },
    });

    driverObj.drive();
    driverRef.current = driverObj;

    return () => {
      try { driverRef.current?.destroy(); } catch (_) {}
      driverRef.current = null;
    };
  }, [tourPending, tourPage, isReady]);
  // ^ Re-evaluates whenever: user accepts consent (tourPending flips),
  //   page loads its data (isReady flips), or page changes (tourPage flips).
}

// ── Schedule Page Tour ─────────────────────────────────────────────────────────
// Two-phase tour:
//   Phase 1 (steps 0-6): main page elements while offcanvas is closed.
//   Phase 2 (steps 7-14): offcanvas fields — opened programmatically on step 7 Next.
// isReady: pass !loading so the tour only starts after the DOM is populated.
export function useScheduleTour({ isReady = true } = {}) {
  const driverRef    = useRef(null);
  const tourPending  = useSessionStore((s) => s.tourPending);
  const tourPage     = useSessionStore((s) => s.tourPage);
  const completeTour = useSessionStore((s) => s.completeTour);

  useEffect(() => {
    if (!tourPending || tourPage !== 'schedule' || !isReady) return;
    if (driverRef.current) return;

    // Start from the top so the filter bar is in view when the tour begins.
    window.scrollTo({ top: 0, behavior: 'instant' });

    const OFFCANVAS_ID = 'raise_Feedback';
    // Index of the New-button step; clicking Next here opens the offcanvas.
    const NEW_BTN_IDX  = 7;

    const openOffcanvasAndAdvance = () => {
      // Close any competing offcanvas panels so only New Schedule is visible.
      ['Employee_Shift', 'Employee_Profile_Sidebar', 'trips', 'profileSidebar'].forEach((id) => {
        const other = document.getElementById(id);
        if (other) Offcanvas.getInstance(other)?.hide();
      });

      const el = document.getElementById(OFFCANVAS_ID);
      if (!el) { driverObj.moveNext(); return; }

      // If the user already opened the panel manually, it has the 'show' class and
      // the 'shown.bs.offcanvas' event will never fire — advance immediately in that case.
      if (el.classList.contains('show')) {
        driverObj.moveNext();
        return;
      }

      el.addEventListener('shown.bs.offcanvas', () => driverObj.moveNext(), { once: true });
      Offcanvas.getOrCreateInstance(el).show();
    };

    const closeOffcanvas = () => {
      try {
        const el = document.getElementById(OFFCANVAS_ID);
        if (el) Offcanvas.getInstance(el)?.hide();
      } catch (_) {}
    };

    const driverObj = driver({
      ...BASE_CONFIG,
      steps: [
        // ── Phase 1: Main page (offcanvas closed) ───────────────────────────
        {
          popover: {
            title: '📅 Schedule Management',
            description:
              "This is where you manage your team's weekly transport schedules. Let's walk through the key features.",
            align: 'center',
          },
        },
        {
          element: '#tour-manager-filter',
          popover: {
            title: '👔 Filter by Manager',
            description:
              'Select a manager to view and manage schedules for their direct reports. Useful when you oversee multiple teams.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-from-date',
          popover: {
            title: '📆 Navigate Weeks',
            description:
              'Use this date picker to jump to any week. The schedule grid updates to display 7 days from your chosen date.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-schedule-toolbar',
          popover: {
            title: '🔍 Search & Refresh',
            description:
              'Type an employee name or ID to filter the grid in real time. The refresh icon pulls the latest data from the server.',
            side: 'bottom',
            align: 'end',
          },
        },
        {
          element: '#mgrschedule',
          popover: {
            title: '🗓️ Weekly Schedule Grid',
            description:
              "Each row is an employee; each column is a day. Times show pickup (↑) and drop (↓) shifts. A car icon means a trip is generated. Click any employee's name to open their transport profile and update preferences.",
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#tour-replicate-btn',
          popover: {
            title: '🔁 Replicate Schedule',
            description:
              'Copy an existing roster to future weeks in one click — a real time-saver when shifts stay consistent.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          popover: {
            title: '➕ Creating a New Roster',
            description:
              "Now let's see how to roster your team. Click Next and we'll open the New Schedule panel for you.",
            align: 'center',
            nextBtnText: 'Show Me →',
          },
        },
        // ── Phase 2: New Schedule offcanvas ─────────────────────────────────
        {
          element: '#tour-new-btn',
          popover: {
            title: '➕ New Button',
            description:
              "Click this button any time you need to create a new roster. We'll open the panel now so you can see each field.",
            side: 'bottom',
            align: 'end',
            nextBtnText: 'Open Panel →',
          },
        },
        {
          element: '#tour-cutoff-timings',
          popover: {
            title: '⏰ Cut Off Timings',
            description:
              'These are system-configured lock timings. Schedules must be submitted before the cut-off to generate trips for that day — keep an eye on these during busy periods.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-process',
          popover: {
            title: '🏢 Select Process',
            description:
              'Choose the business process (team) for this roster. This filters the employee list below to only show members from that process.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-date-range',
          popover: {
            title: '📅 Roster Date Range',
            description:
              'Set the From and To dates for this schedule. The roster will apply to all working days in this range — typically a week or a month.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-facilities',
          popover: {
            title: '🏬 Login & Logout Facility',
            description:
              'Select the office facility for pickup (Login) and drop (Logout). Employees will be routed to these facilities during their shifts.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-weekly-off-section',
          popover: {
            title: '📆 Weekly Off Days',
            description:
              'Mark which days employees are off. Transport will not be generated for checked days — Sat and Sun are typically checked for 5-day work weeks.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-shifts-section',
          popover: {
            title: '🕐 Shift Timings',
            description:
              'Assign login and logout shift times for weekdays and weekends separately. Select N/A for days when no transport is needed.',
            side: 'top',
            align: 'start',
          },
        },
        {
          popover: {
            title: '👥 Select Employees',
            description:
              "Once you've filled the fields above, your team members appear in a table below. Check the employees to roster, then click Save — their weekly transport schedule is created instantly.",
            align: 'center',
          },
        },
        {
          popover: {
            title: "🎉 You're All Set!",
            description:
              "Tour complete! Use the sidebar to explore billing, compliance, master data, reports, and more. Welcome to eTMS!",
            align: 'center',
          },
        },
      ],

      onNextClick: () => {
        const idx = driverObj.getActiveIndex();
        if (idx === NEW_BTN_IDX) {
          // Open the offcanvas; advance to the next step only after it's fully visible.
          openOffcanvasAndAdvance();
        } else {
          driverObj.moveNext();
        }
      },

      // Ensure every highlighted element is fully in view regardless of which
      // container is scrollable (window vs an inner overflow div).
      onHighlightStarted: (element) => {
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }
      },

      onDestroyed: () => {
        closeOffcanvas();
        completeTour();
      },
    });

    driverObj.drive();
    driverRef.current = driverObj;

    return () => {
      try { closeOffcanvas(); driverRef.current?.destroy(); } catch (_) {}
      driverRef.current = null;
    };
  }, [tourPending, tourPage, isReady]);
}

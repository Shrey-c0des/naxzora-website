import sys
import ezdxf
from ezdxf.addons.drawing import Frontend, RenderContext
from ezdxf.addons.drawing.matplotlib import MatplotlibBackend
import matplotlib.pyplot as plt

def convert(dxf_file, img_file):
    doc = ezdxf.readfile(dxf_file)
    msp = doc.modelspace()
    fig = plt.figure()
    ax = fig.add_axes([0, 0, 1, 1])
    ctx = RenderContext(doc)
    out = MatplotlibBackend(ax)
    Frontend(ctx, out).draw_layout(msp)
    
    # Save with transparent background
    fig.savefig(img_file, dpi=300, transparent=True, bbox_inches='tight')
    print("DXF converted to PNG")

if __name__ == "__main__":
    convert(sys.argv[1], sys.argv[2])

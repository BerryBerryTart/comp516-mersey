from PIL import Image
import csv

def hexToRGB(code):
    return ((int(code[1:3], 16), int(code[3:5], 16), int(code[5::], 16)))


def main():
    img = Image.new('RGB', (768, 512))
    with open("r:/dataColour.csv", "r") as csvfile:
        reader = csv.reader(csvfile, delimiter=',')
        headers = next(reader)
        for row in reader:
          img.putpixel((int(row[0]), int(row[1])), hexToRGB(row[2]))
    img.show()


if __name__ == "__main__":
    main()
